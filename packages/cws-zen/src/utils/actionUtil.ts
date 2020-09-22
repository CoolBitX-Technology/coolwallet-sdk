import BN from 'bn.js';
import { transport, apdu, tx, error } from '@coolwallet/core';
import * as varuint from './varuint';
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
	getUtxoArguments
};

function hash160(buf: Buffer): Buffer {
	zencashjs
	return zencashjs.crypto.hash160(buf);
}

function doubleSha256(buf: Buffer): Buffer {
	return zencashjs.crypto.sha256x2(buf);
}

const ZERO = Buffer.alloc(1, 0);

function toDER(x: Buffer): Buffer {
	let i = 0;
	while (x[i] === 0) ++i;
	if (i === x.length) return ZERO;
	x = x.slice(i);
	if (x[0] & 0x80) return Buffer.concat([ZERO, x], 1 + x.length);
	return x;
}

function encodeDerSig(signature: Buffer, hashType: Buffer): Buffer {
	const r = toDER(signature.slice(0, 32));
	const s = toDER(signature.slice(32, 64));
	return Buffer.concat([bip66Encode(r, s), hashType]);
}

function bip66Encode(r: Buffer, s: Buffer) {
	const lenR = r.length;
	const lenS = s.length;
	if (lenR === 0) throw new error.SDKError(bip66Encode.name, 'R length is zero');
	if (lenS === 0) throw new error.SDKError(bip66Encode.name, 'S length is zero');
	if (lenR > 33) throw new error.SDKError(bip66Encode.name, 'R length is too long');
	if (lenS > 33) throw new error.SDKError(bip66Encode.name, 'S length is too long');
	if (r[0] & 0x80) throw new error.SDKError(bip66Encode.name, 'R value is negative');
	if (s[0] & 0x80) throw new error.SDKError(bip66Encode.name, 'S value is negative');
	if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) throw new error.SDKError(bip66Encode.name, 'R value excessively padded');
	if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) throw new error.SDKError(bip66Encode.name, 'S value excessively padded');

	const signature = Buffer.allocUnsafe(6 + lenR + lenS);

	// 0x30 [total-length] 0x02 [R-length] [R] 0x02 [S-length] [S]
	signature[0] = 0x30;
	signature[1] = signature.length - 2;
	signature[2] = 0x02;
	signature[3] = r.length;
	r.copy(signature, 4);
	signature[4 + lenR] = 0x02;
	signature[5 + lenR] = s.length;
	s.copy(signature, 6 + lenR);

	return signature;
}

function toVarUintBuffer(int: number): Buffer {
	return varuint.encode(int);
}

function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray()).reverse();
	return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

function toNonReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
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
			await apdu.tx.setChangeKeyid(transport, appId, appPrivateKey, '00', change.addressIndex, redeemType);
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
		const keyId = tx.util.addressIndexToKeyId('00', preparedData.preparedInputs[i].addressIndex);
		const readType = '01';
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
		outScript: outputScript,
		outHash: outputHash
	} = addressToOutScript(output.address);
	if (!outputHash) {
		throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	//todo
	if (outputType == ScriptType.P2PKH) {
		outputScriptType = toUintBuffer(0, 1);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == ScriptType.P2SH) {
		outputScriptType = toUintBuffer(1, 1);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else {
		throw new error.SDKError(getArgument.name, `Unsupport ScriptType : ${outputType}`);
	}
	const outputAmount = toNonReverseUintBuffer(output.value, 8);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(getArgument.name, 'Public Key not exists !!');
		haveChange = toUintBuffer(1, 1);
		changeScriptType = toUintBuffer(outputType, 1);
		changeAmount = toNonReverseUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from(`328000002C800000008000000000000000${addressIdxHex}`, 'hex');
	} else {
		haveChange = Buffer.from('00', 'hex');
		changeScriptType = Buffer.from('00', 'hex');
		changeAmount = Buffer.from('0000000000000000', 'hex');
		changePath = Buffer.from('000000000000000000000000000000000000000000', 'hex');
	}
	const prevouts = inputs.map(input => {
		return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(),
		toUintBuffer(input.preIndex, 4)])
	})
	const hashPrevouts = doubleSha256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
			//Buffer.from(input.sequence, 'hex').reverse(),
			toUintBuffer(input.preIndex, 4)
		])
	})
	const hashSequence = doubleSha256(Buffer.concat(sequences));

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

function getUtxoArguments(
	inputs: Array<Input>,
	preparedData: PreparedData,
): Array<string> {
	const utxoArguments = preparedData.preparedInputs.map(
		(preparedInput) => {
			const addressIdxHex = "00".concat(preparedInput.addressIndex.toString(16).padStart(6, "0"));
			const SEPath = `15328000002C800000008000000000000000${addressIdxHex}`;
			const outPoint = preparedInput.preOutPointBuf;
			// todo
			const inputScriptType = toUintBuffer(0, 1);
			const inputAmount = preparedInput.preValueBuf.reverse();
			const inputHash = hash160(preparedInput.pubkeyBuf);
			return Buffer.concat([Buffer.from(SEPath, 'hex'), outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
		});
	return utxoArguments;
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
			const outPoint = preparedInput.preOutPointBuf;
			let inputScriptType;
			// TODO
			if (scriptType == ScriptType.P2PKH) {
				inputScriptType = toVarUintBuffer(0);
			} else {//(scriptType == ScriptType.P2SH)
				inputScriptType = toVarUintBuffer(1);
			}
			const inputAmount = preparedInput.preValueBuf.reverse();
			const inputHash = hash160(preparedInput.pubkeyBuf);
			return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
		});

	const actions = utxoArguments.map(
		(utxoArgument) => async () => {
			return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, utxoArgument, (scriptType === ScriptType.P2PKH) ? "10" : "11");
		});
	return { preActions, actions };
};