import BN from 'bn.js';
import { transport, tx, apdu } from '@coolwallet/core';
//import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuint';
import * as scripts from "./scripts";
import { coinType } from './index'
import {
	ScriptType, AddressFormat, Input, Output, Change, PreparedData
} from './types';
type Transport = transport.default;
const bitcore = require('bitcore-lib-cash');
const bchaddr = require('bchaddrjs');

export {
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	pubkeyToAddressAndOutScript,
	addressToOutScript,
	createUnsignedTransactions,
	getSigningActions,
	composeFinalTransaction,
	getScriptSigningActions
};

function hash160(buf: Buffer): Buffer {
	return bitcore.crypto.Hash.sha256ripemd160(buf);
}

function doubleHash256(buf: Buffer): Buffer {
	return bitcore.crypto.Hash.sha256(bitcore.crypto.Hash.sha256(buf));
}

const ZERO = Buffer.alloc(1, 0);

function toVarUintBuffer(int: number): Buffer {
	return varuint.encode(int);
}

function toReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray()).reverse();
	return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray());
	return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}

function addressToOutScript(address: string
): {
	scriptType: ScriptType,
	outScript: Buffer,
	outHash: Buffer
} {
	if (!bchaddr.isValidAddress(address)) {
		throw new Error(`Unsupport Address : ${address}`);
	}
	let addrBuf;
	if (bchaddr.isCashAddress(address)) {
		addrBuf = bitcore.Address.fromString(address).toBuffer()
	} else {
		addrBuf = bitcore.encoding.Base58.decode(address)
	}
	if (addrBuf.length != 21) {
		throw new Error(`Unsupport script hash : ${addrBuf.toString('hex')}`);
	}
	const outHash = addrBuf.slice(1, 21)
	let outScript;
	let scriptType;
	if (bchaddr.isP2PKHAddress(address)) {
		scriptType = ScriptType.P2PKH
		outScript = Buffer.from(`76a914${outHash.toString('hex')}88ac`, 'hex')
	} else {
		scriptType = ScriptType.P2SH
		outScript = Buffer.from(`a914${outHash.toString('hex')}87`, 'hex')
	}
	return { scriptType, outScript, outHash };
}

function pubkeyToAddressAndOutScript(pubkey: Buffer)
	: {
		address: string,
		outScript: Buffer
	} {
	const Address = bitcore.Address;
	const PublicKey = bitcore.PublicKey
	const pubkeyObj = new PublicKey(pubkey);
	const addressObj = Address.fromPublicKey(pubkeyObj)

	const outScript = Buffer.from(`76a914${hash160(pubkey).toString('hex')}88ac`, 'hex')
	return { address: addressObj.toCashAddress(), outScript }
}

function createUnsignedTransactions(
	scriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	change: Change | undefined,
	version: number = 1,
	lockTime: number = 0,
): {
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>
} {
	const versionBuf = toReverseUintBuffer(version, 4);
	const lockTimeBuf = toReverseUintBuffer(lockTime, 4);

	const inputsCount = toVarUintBuffer(inputs.length);
	const preparedInputs = inputs.map(({
		preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf
	}) => {
		if (!pubkeyBuf) throw new Error('Public Key not exists !!');

		const preOutPointBuf = Buffer.concat([
			Buffer.from(preTxHash, 'hex').reverse(),
			toReverseUintBuffer(preIndex, 4),
		]);

		const preValueBuf = toReverseUintBuffer(preValue, 8);
		const sequenceBuf = (sequence) ? toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

		return {
			addressIndex, pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf
		};
	});

	const {
		scriptType: outputType,
		outScript: outputScript
	} = addressToOutScript(output.address);
	const outputScriptLen = toVarUintBuffer(outputScript.length);

	const outputArray = [
		Buffer.concat([toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])
	];
	if (change) {
		if (!change.pubkeyBuf) throw new Error('Public Key not exists !!');
		const changeValue = toReverseUintBuffer(change.value, 8);
		const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf);
		const outScriptLen = toVarUintBuffer(outScript.length);
		outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
	}

	const outputsCount = toVarUintBuffer((change) ? 2 : 1);
	const outputsBuf = Buffer.concat(outputArray);

	const hashPrevouts = doubleHash256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
	const hashSequence = doubleHash256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
	const hashOutputs = doubleHash256(outputsBuf);

	const unsignedTransactions = preparedInputs.map(({
		pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf
	}) => {
		let scriptCode;
		if (scriptType === ScriptType.P2PKH) {
			scriptCode = Buffer.from(`1976a914${hash160(pubkeyBuf).toString('hex')}88ac`, 'hex');
		} else {//P2SH
			scriptCode = Buffer.from(`17a914${hash160(pubkeyBuf).toString('hex')}87`, 'hex');
		}

		return Buffer.concat([
			versionBuf,
			hashPrevouts,
			hashSequence,
			preOutPointBuf,
			scriptCode,
			preValueBuf,
			sequenceBuf,
			hashOutputs,
			lockTimeBuf,
			Buffer.from('41000000', 'hex'),
		]);

	});

	return {
		preparedData: {
			versionBuf,
			inputsCount,
			preparedInputs,
			outputType,
			outputsCount,
			outputsBuf,
			lockTimeBuf,
		},
		unsignedTransactions,
	};
}

function getSigningActions(
	transport: Transport,
	scriptType: ScriptType,
	appId: string,
	appPrivateKey: string,
	change: Change | undefined,
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>,
): {
	preActions: Array<Function>,
	actions: Array<Function>
} {
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
		return apdu.tx.txPrep(transport, txDataHex, '05', appPrivateKey);
	};
	preActions.push(parsingOutputAction);

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = tx.util.addressIndexToKeyId(coinType, preparedData.preparedInputs[i].addressIndex);
		const readType = '91';
		const txDataHex = tx.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return apdu.tx.txPrep(transport, txDataHex, txDataType, appPrivateKey);
	}));

	return { preActions, actions };
}

function composeFinalTransaction(
	scriptType: ScriptType,
	preparedData: PreparedData,
	signatures: Array<Buffer>
): Buffer {
	const {
		versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf
	} = preparedData;

	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2SH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	const inputsBuf = Buffer.concat(preparedInputs.map((data, i) => {
		const { pubkeyBuf, preOutPointBuf, sequenceBuf } = data;
		const signature = signatures[i];
		const inScript = Buffer.concat([
			Buffer.from((signature.length + 1).toString(16), 'hex'),
			signature,
			Buffer.from('41', 'hex'),
			Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
			pubkeyBuf,
		]);
		return Buffer.concat([
			preOutPointBuf, toVarUintBuffer(inScript.length), inScript, sequenceBuf
		]);
	}));
	return Buffer.concat([
		versionBuf,
		inputsCount,
		inputsBuf,
		outputsCount,
		outputsBuf,
		lockTimeBuf,
	]);
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
		throw new Error(`OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	outputScriptType = toVarUintBuffer(outputType);
	outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');

	const outputAmount = toUintBuffer(output.value, 8);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	if (change) {
		if (!change.pubkeyBuf) {
			throw new Error('Public Key not exists !!');
		}
		haveChange = toVarUintBuffer(1);
		changeScriptType = toVarUintBuffer(outputType);
		changeAmount = toUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from('32' + '8000002C' + '800000' + coinType + '80000000' + '00000000' + addressIdxHex, 'hex');
	} else {
		haveChange = Buffer.from('00', 'hex');
		changeScriptType = Buffer.from('00', 'hex');
		changeAmount = toUintBuffer(0, 8)//)Buffer.from('0000000000000000', 'hex');
		changePath = toUintBuffer(0, 21)//Buffer.from('000000000000000000000000000000000000000000', 'hex');
	}
	const prevouts = inputs.map(input => {
		return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(),
		toReverseUintBuffer(input.preIndex, 4)])
	})
	const hashPrevouts = doubleHash256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
		])
	})
	const hashSequence = doubleHash256(Buffer.concat(sequences));

	return Buffer.concat([
		outputScriptType,
		outputAmount,
		outputHashBuf,
		haveChange,
		changeScriptType,
		changeAmount,
		changePath,
		hashPrevouts,
		hashSequence,
	]).toString('hex');
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
			const addressIdxHex = "00".concat(preparedInput.addressIndex.toString(16).padStart(6, "0"));
			const SEPath = Buffer.from(`15328000002C800000${coinType}8000000000000000${addressIdxHex}`, 'hex')
			const outPoint = preparedInput.preOutPointBuf;
			let inputScriptType;
			if (scriptType == ScriptType.P2PKH) {
				inputScriptType = toVarUintBuffer(0);
			} else {//scriptType == ScriptType.P2SH
				inputScriptType = toVarUintBuffer(1);
			}
			const inputAmount = preparedInput.preValueBuf.reverse();
			const inputHash = hash160(preparedInput.pubkeyBuf);
			return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
		});

	const actions = utxoArguments.map(
		(utxoArgument) => async () => {
			return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, utxoArgument, "12");
		});
	return { preActions, actions };
};
