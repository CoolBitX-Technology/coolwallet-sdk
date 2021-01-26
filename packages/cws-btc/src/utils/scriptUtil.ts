import BN from 'bn.js';
import { transport, apdu, tx, error } from '@coolwallet/core';
import * as bitcoin from 'bitcoinjs-lib';
import * as cryptoUtil from './cryptoUtil';
import * as txUtil from './transactionUtil';
import * as varuint from './varuintUtil';
import { COIN_TYPE } from '../config/param'
import { utils } from '@coolwallet/core';
import { ScriptType, OmniType, Input, Output, Change, PreparedData } from '../config/types';

type Transport = transport.default;


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

const getPath = async (addressIndex: number) => {
	let path = utils.getPath(COIN_TYPE, addressIndex)
	path = path.length.toString(16) + path
	return path
};


export function getSigningActions(
	transport: Transport,
	redeemScriptType: ScriptType,
	appId: string,
	appPrivateKey: string,
	change: Change | undefined,
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>,
	omniType?: OmniType
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
			if (redeemScriptType === ScriptType.P2WPKH) {
				throw new error.SDKError(getSigningActions.name, 'not support P2WPKH change');
			} else {
				// TODO
				const redeemType = (redeemScriptType === ScriptType.P2PKH) ? '00' : '01';
				await apdu.tx.setChangeKeyid(transport, appId, appPrivateKey, COIN_TYPE, change.addressIndex, redeemType);
			}
		}
		preActions.push(changeAction);
	}

	const parsingOutputAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		let txDataType
		if (!omniType) {
			txDataType = (preparedData.outputType === ScriptType.P2WPKH) ? '0C' : '01';
		} else {
			if (omniType === OmniType.USDT) {
				txDataType = '0A';
			} else {
				throw new error.SDKError(getSigningActions.name, `Unsupport omniType : ${omniType}`);
			}
		}
		return apdu.tx.txPrep(transport, txDataHex, txDataType, appPrivateKey);
	};
	preActions.push(parsingOutputAction);

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = tx.util.addressIndexToKeyId(COIN_TYPE, preparedData.preparedInputs[i].addressIndex);
		let readType
		if (!omniType) {
			if (redeemScriptType === ScriptType.P2PKH) {
				readType = '00';
			} else {
				readType = '01';
			}
		} else {
			if (omniType === OmniType.USDT) {
				readType = 'C8';
			} else {
				throw new error.SDKError(getSigningActions.name, `Unsupport omniType : ${omniType}`);
			}
		}
		const txDataHex = tx.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return apdu.tx.txPrep(transport, txDataHex, txDataType, appPrivateKey);
	}));

	return { preActions, actions };
}

export function getScriptSigningActions(
	transport: Transport,
	redeemScriptType: ScriptType,
	appId: string,
	appPrivateKey: string,
	preparedData: PreparedData
): {
	actions: Array<Function>
} {

	const utxoArguments = preparedData.preparedInputs.map(
		async (preparedInput) => {
			// const addressIdHex = "00".concat(preparedInput.addressIndex.toString(16).padStart(6, "0"));
			const path = await getPath(preparedInput.addressIndex)
			const SEPath = Buffer.from(path , 'hex')
			const outPoint = preparedInput.preOutPointBuf;
			let inputScriptType;
			// TODO
			if ((redeemScriptType == ScriptType.P2PKH) ||
				(redeemScriptType == ScriptType.P2WPKH) ||
				(redeemScriptType == ScriptType.P2SH_P2WPKH)) {
				inputScriptType = varuint.encode(0);
			} else {//(scriptType == ScriptType.P2WSH)
				inputScriptType = varuint.encode(1);
			}
			const inputAmount = preparedInput.preValueBuf.reverse();
			const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
			return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
		});

	const actions = utxoArguments.map(
		(utxoArgument) => async () => {
			console.log("utxoArgument: " + utxoArgument)
			return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, await utxoArgument, (redeemScriptType === ScriptType.P2PKH) ? "10" : "11");
		});
	return { actions };
};

export function getScriptSigningPreActions(
	transport: Transport,
	appId: string,
	appPrivateKey: string,
	script: string,
	inputArgument: string
): {
	preActions: Array<Function>
} {
	// const argument = "00" + getBTCArgument(redeemScriptType, inputs, output, change);// keylength zero
	const argument = "00" + inputArgument;// keylength zero
	console.log(argument)

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

	return { preActions };
};

export function getBTCArgument(
	scriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	change?: Change,
): string {
	const {
		scriptType: outputType,
		outHash: outputHash
	} = txUtil.addressToOutScript(output.address);
	if (!outputHash) {
		throw new error.SDKError(getBTCArgument.name, `OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	if (outputType == ScriptType.P2PKH || outputType == ScriptType.P2SH_P2WPKH || outputType == ScriptType.P2WPKH) {
		outputScriptType = varuint.encode(outputType);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == ScriptType.P2WSH) {
		outputScriptType = varuint.encode(outputType);
		outputHashBuf = Buffer.from(outputHash.toString('hex'), 'hex');
	} else {
		throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
	}
	const outputAmount = toUintBuffer(output.value, 8);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(getBTCArgument.name, 'Public Key not exists !!');
		haveChange = varuint.encode(1);
		changeScriptType = toUintBuffer(scriptType, 1);
		changeAmount = toUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from('32' + '8000002C' + '800000' + COIN_TYPE + '80000000' + '00000000' + addressIdxHex, 'hex');
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
	const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex')
		])
	})
	const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(sequences));

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

export async function getUSDTArgument(
	scriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	value: string,
	change?: Change,
) {
	const {
		scriptType: outputType,
		outHash: outputHash
	} = txUtil.addressToOutScript(output.address);
	if (!outputHash) {
		throw new error.SDKError(getBTCArgument.name, `OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	if (outputType == ScriptType.P2PKH || outputType == ScriptType.P2SH_P2WPKH || outputType == ScriptType.P2WPKH) {
		outputScriptType = varuint.encode(outputType);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == ScriptType.P2WSH) {
		outputScriptType = varuint.encode(outputType);
		outputHashBuf = Buffer.from(outputHash.toString('hex'), 'hex');
	} else {
		throw new error.SDKError(getBTCArgument.name, `Unsupport ScriptType '${outputType}'`);
	}
	const outputAmount = toUintBuffer(output.value, 8);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(getBTCArgument.name, 'Public Key not exists !!');
		haveChange = varuint.encode(1);
		changeScriptType = toUintBuffer(scriptType, 1);
		changeAmount = toUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from('32' + '8000002C' + '800000' + COIN_TYPE + '80000000' + '00000000' + addressIdxHex, 'hex');
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
	const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex')
		])
	})
	const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(sequences));

	const usdtAmount = toUintBuffer(value, 8);

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
		usdtAmount
	]).toString('hex');
};
