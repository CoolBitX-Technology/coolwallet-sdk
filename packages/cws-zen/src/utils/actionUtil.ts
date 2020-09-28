import BN from 'bn.js';
import { transport, apdu, tx, error } from '@coolwallet/core';
import * as scripts from "./scripts";
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
import { addressToOutScript } from './transactionUtil';
import { coinType } from '../index'
const zencashjs = require('zencashjs')
type Transport = transport.default;

export {
	Input,
	Output,
	Change,
	PreparedData,
	getSigningActions,
	getScriptSigningActions,
	getScriptAndArgument,
};

function hash160(buf: Buffer): Buffer {
	return Buffer.from(zencashjs.crypto.hash160(buf), 'hex');
}

function doubleSha256(buf: Buffer): Buffer {

	return Buffer.from(zencashjs.crypto.sha256x2(buf), 'hex');
}

function toVarUintBuffer(value: number): Buffer {
	const hex = value.toString(16);
	return Buffer.from(hex.length % 2 !== 0 ? `0${hex}` : hex, 'hex')
}

function toReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray()).reverse();
	return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

function toUintBuffer(numberOrString: number | string, byteSize: number, encode?: string): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray());
	return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}

function hexStringToUintBuffer(string: string, byteSize: number, encode?: string): Buffer {
	const bn = new BN(string, 'hex');
	const buf = Buffer.from(bn.toArray());
	return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}

function getSigningActions(
	transport: Transport,
	scriptType: ScriptType,
	appId: string,
	appPrivateKey: string,
	change: Change | undefined,
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>,

): ({ preActions: Array<Function>, actions: Array<Function> }) {
	const preActions = [];
	const sayHi = async () => {
		await apdu.general.hi(transport, appId);
	}
	preActions.push(sayHi)
	if (change) {
		const changeAction = async () => {
			const redeemType = (scriptType === ScriptType.P2PKH) ? '00' : '01';
			await apdu.tx.setChangeKeyid(transport, appId, appPrivateKey, coinType, change.addressIndex, redeemType);
		}
		preActions.push(changeAction);
	}

	const parsingOutputAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		const txDataType = '08';
		return apdu.tx.txPrep(transport, txDataHex, txDataType, appPrivateKey);
	};
	preActions.push(parsingOutputAction);

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = tx.util.addressIndexToKeyId(coinType, preparedData.preparedInputs[i].addressIndex);
		const readType = '79';
		const txDataHex = tx.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return apdu.tx.txPrep(transport, txDataHex, txDataType, appPrivateKey);
	}));
	return { preActions, actions };
}

function getArgument(
	inputs: Array<Input>,
	output: Output,
	change?: Change,
): string {
	const {
		scriptType: outputType,
		outHash: outputHash
	} = addressToOutScript(output.address);
	if (!outputHash) {
		throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	//[outputScriptType(1B)] [outputAmount(8B)] [outputHash(12+20B)] [outputBlockHash(32B)] [outputBlockHeight(3B)] 
	if (outputType == ScriptType.P2PKH) {
		outputScriptType = toVarUintBuffer(0);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == ScriptType.P2SH) {
		outputScriptType = toVarUintBuffer(1);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else {
		throw new error.SDKError(getArgument.name, `Unsupport ScriptType : ${outputType}`);
	}
	const outputAmount = toUintBuffer(output.value, 8);
	const outputBlockHash = hexStringToUintBuffer(output.blockHash, 32).reverse();
	const outputBlockHeight = toReverseUintBuffer(output.blockHeight, 3);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)] [changeBlockHash(32B)] [changeBlockHeight(3B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	let changeBlockHash;
	let changeBlockHeight;
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(getArgument.name, 'Public Key not exists !!');
		haveChange = toVarUintBuffer(1);
		changeScriptType = toVarUintBuffer(outputType);
		changeAmount = toUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from(`328000002C800000${coinType}8000000000000000${addressIdxHex}`, 'hex');
		changeBlockHash = hexStringToUintBuffer(change.blockHash, 32).reverse();
		changeBlockHeight = toReverseUintBuffer(change.blockHeight, 3);
	} else {
		haveChange = Buffer.from('00', 'hex');
		changeScriptType = Buffer.from('00', 'hex');
		changeAmount = Buffer.from('0000000000000000', 'hex');
		changePath = Buffer.from('000000000000000000000000000000000000000000', 'hex');
		changeBlockHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
		changeBlockHeight = Buffer.from('000000', 'hex');
	}

	//[hashPrevouts(32B] [hashSequence(32B)]
	const prevouts = inputs.map(input => {
		return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(),
		toReverseUintBuffer(input.preIndex, 4)])
	})
	const hashPrevouts = doubleSha256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
			toReverseUintBuffer(input.preIndex, 4)
		])
	})
	const hashSequence = doubleSha256(Buffer.concat(sequences));

	return Buffer.concat([
		outputScriptType,
		outputAmount,
		outputHashBuf,
		outputBlockHash,
		outputBlockHeight,
		haveChange,
		changeScriptType,
		changeAmount,
		changePath,
		changeBlockHash,
		changeBlockHeight,
		hashPrevouts,
		hashSequence,
	]).toString('hex');
};

function getScriptAndArgument(
	inputs: Array<Input>,
	output: Output,
	change: Change | undefined
): {
	script: string,
	argument: string
} {
	const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
	const argument = getArgument(inputs, output, change);
	return {
		script,
		argument: "00" + argument,// keylength zero
	};
};

function getScriptSigningActions(
	transport: Transport,
	scriptType: ScriptType,
	appId: string,
	appPrivateKey: string,
	inputs: Array<Input>,
	preparedData: PreparedData,
	output: Output,
	change: Change | undefined
): {
	preActions: Array<Function>,
	actions: Array<Function>
} {
	const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
	const argument = "00" + getArgument(inputs, output, change);// keylength zero

	const preActions = [];
	const sendScript = async () => {
		await apdu.tx.sendScript(transport, script);
	}
	preActions.push(sendScript);

	const sendArgument = async () => {
		await apdu.tx.executeScript(
			transport,
			appId,
			appPrivateKey,
			argument
		);
	}
	preActions.push(sendArgument);

	const utxoArguments = preparedData.preparedInputs.map(
		(preparedInput) => {
			const addressIdHex = "00".concat(preparedInput.addressIndex.toString(16).padStart(6, "0"));
			const SEPath = Buffer.from(`15328000002C800000${coinType}8000000000000000${addressIdHex}`, 'hex')
			//[outPoint(32+4B)] [inputScriptType(1B)] [inputAmount(8B)] [inputHash(20B)] [inputBlockHash(32B)] [inputBlockHeight(3B)]
			const outPoint = preparedInput.preOutPointBuf;
			let inputScriptType;
			if (scriptType == ScriptType.P2PKH) {
				inputScriptType = toVarUintBuffer(0);
			} else {//(scriptType == ScriptType.P2SH)
				inputScriptType = toVarUintBuffer(1);
			}
			const inputAmount = Buffer.from('0000000000000000', 'hex');
			const inputHash = hash160(preparedInput.pubkeyBuf);
			const inputBlockHash = preparedInput.blockHashBuf.reverse();
			const inputBlockHeight = preparedInput.blockHeightBuf.reverse();
			return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash, inputBlockHash, inputBlockHeight]).toString('hex');
		});


	const actions = utxoArguments.map(
		(utxoArgument) => async () => {
			return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, utxoArgument, "13");
		});
	return { preActions, actions };
};