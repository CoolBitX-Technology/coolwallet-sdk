import BN from 'bn.js';
import { error } from '@coolwallet/core';
import * as varuint from './varuint';
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
const bs58check = require('bs58check')
const zencashjs = require('zencashjs')


export {
	Input,
	Output,
	Change,
	PreparedData,
	pubkeyToAddressAndOutScript,
	addressToOutScript,
	createUnsignedTransactions,
	composeFinalTransaction,
};

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
	if (lenR === 0) {
		throw new error.SDKError(bip66Encode.name, 'R length is zero');
	}
	if (lenS === 0) {
		throw new error.SDKError(bip66Encode.name, 'S length is zero');
	}
	if (lenR > 33) {
		throw new error.SDKError(bip66Encode.name, 'R length is too long');
	}
	if (lenS > 33) {
		throw new error.SDKError(bip66Encode.name, 'S length is too long');
	}
	if (r[0] & 0x80) {
		throw new error.SDKError(bip66Encode.name, 'R value is negative');
	}
	if (s[0] & 0x80) {
		throw new error.SDKError(bip66Encode.name, 'S value is negative');
	}
	if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) {
		throw new error.SDKError(bip66Encode.name, 'R value excessively padded');
	}
	if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) {
		throw new error.SDKError(bip66Encode.name, 'S value excessively padded');
	}

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

function toVarUintBuffer(value: number): Buffer {
	const hex = value.toString(16);
	return Buffer.from(hex.length % 2 !== 0 ? `0${hex}` : hex, 'hex')
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

function addressToOutScript(
	address: string
): {
	scriptType: ScriptType,
	outScript: Buffer,
	outHash: Buffer
} {
	const decode = bs58check.decode(address);
	const prefix = decode.slice(0, 2).toString('hex')
	const outHash = decode.slice(2, decode.length)
	let scriptType, outScript
	if (prefix == '2089') {
		scriptType = ScriptType.P2PKH
		outScript = Buffer.from(`76a914${outHash.toString('hex')}88ac`, 'hex')
	} else if (prefix == '2096') {
		scriptType = ScriptType.P2SH
		outScript = Buffer.from(`a914${outHash.toString('hex')}87`, 'hex')
	} else {
		throw new error.SDKError(addressToOutScript.name, `Invalid Address '${address}'`);
	}
	return { scriptType, outScript, outHash };
}

function pubkeyToAddressAndOutScript(
	pubkey: Buffer,
	scriptType: ScriptType
): {
	address: string,
	outScript: Buffer,
	hash: Buffer
} {
	if ((scriptType != ScriptType.P2PKH) && (scriptType === ScriptType.P2SH)) {
		throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
	}
	const address = zencashjs.address.pubKeyToAddr(pubkey)
	const { outScript, outHash } = addressToOutScript(address);
	return { address, outScript, hash: outHash };
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
		preTxHash, preIndex, sequence, addressIndex, pubkeyBuf, scriptPubKey
	}) => {
		if (!pubkeyBuf) {
			throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
		}
		const preOutPointBuf = Buffer.concat([
			Buffer.from(preTxHash, 'hex').reverse(),
			toReverseUintBuffer(preIndex, 4),
		]);
		const sequenceBuf = (sequence) ? toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');
		let scriptLen
		const scriptPubKeyBuf = Buffer.from(scriptPubKey, 'hex')
		if (scriptType == ScriptType.P2PKH) {
			scriptLen = 25;
		} else {
			scriptLen = 23;
		}

		const blockHashLen = parseInt(scriptPubKeyBuf[scriptLen].toString());
		const blockHashBuf = scriptPubKeyBuf.slice(scriptLen + 1, scriptLen + 1 + blockHashLen)
		const blockHeightLen = parseInt(scriptPubKeyBuf[scriptLen + 1 + blockHashLen].toString());
		const blockHeightBuf = scriptPubKeyBuf.slice(scriptLen + 1 + blockHashLen + 1, scriptLen + 1 + blockHashLen + 1 + blockHeightLen)
		return {
			addressIndex, pubkeyBuf, preOutPointBuf, sequenceBuf, blockHashBuf, blockHeightBuf
		};
	});

	const {
		scriptType: outputType,
		outScript: outputScript
	} = addressToOutScript(output.address);

	const outValue = toReverseUintBuffer(output.value, 8);
	const outBlockHashBuf = Buffer.from(output.blockHash, 'hex').reverse();
	const outBlockHeightBuf = toVarUintBuffer(output.blockHeight).reverse();
	const outScriptPubKey = Buffer.concat([
		outputScript,
		toVarUintBuffer(outBlockHashBuf.length),
		outBlockHashBuf,
		toVarUintBuffer(outBlockHeightBuf.length),
		outBlockHeightBuf,
		Buffer.from('b4', 'hex')
	]);
	const outScriptPubKeyLen = toVarUintBuffer(outScriptPubKey.length);
	const outputArray = [
		Buffer.concat([outValue, outScriptPubKeyLen, outScriptPubKey])
	];
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');

		const { outScript: changeScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, scriptType);
		const changeValue = toReverseUintBuffer(change.value, 8);
		const changeBlockHashBuf = Buffer.from(change.blockHash, 'hex').reverse();
		const changeBlockHeightBuf = toVarUintBuffer(change.blockHeight).reverse();
		const changeScriptPubKey = Buffer.concat([
			changeScript,
			toVarUintBuffer(changeBlockHashBuf.length),
			changeBlockHashBuf,
			toVarUintBuffer(changeBlockHeightBuf.length),
			changeBlockHeightBuf,
			Buffer.from('b4', 'hex')
		]);
		const changeScriptPubKeyLen = toVarUintBuffer(changeScriptPubKey.length);
		outputArray.push(Buffer.concat([changeValue, changeScriptPubKeyLen, changeScriptPubKey]));
	}

	const outputsCount = toVarUintBuffer((change) ? 2 : 1);
	const outputsBuf = Buffer.concat(outputArray);

	const unsignedTransactions = preparedInputs.map(({
		pubkeyBuf, preOutPointBuf, sequenceBuf, blockHashBuf, blockHeightBuf
	}) => {
		const { outScript: preOutScriptBuf } = pubkeyToAddressAndOutScript(pubkeyBuf, scriptType);
		const fullInput = Buffer.concat([
			preOutScriptBuf,
			toVarUintBuffer(blockHashBuf.length),
			blockHashBuf,
			toVarUintBuffer(blockHeightBuf.length),
			blockHeightBuf,
			Buffer.from('b4', 'hex')
		]);
		//const fullInputLen = 
		return Buffer.concat([
			versionBuf,
			toVarUintBuffer(1),
			preOutPointBuf,
			toVarUintBuffer(fullInput.length),
			fullInput,
			sequenceBuf,
			outputsCount,
			outputsBuf,
			lockTimeBuf,
			Buffer.from('81000000', 'hex'),
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
		throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType '${scriptType}'`);
	}

	if (scriptType === ScriptType.P2PKH) {
		const inputsBuf = Buffer.concat(preparedInputs.map((data, i) => {
			const { pubkeyBuf, preOutPointBuf, sequenceBuf } = data;
			const signature = signatures[i];
			const inScript = Buffer.concat([
				Buffer.from((signature.length + 1).toString(16), 'hex'),
				signature,
				Buffer.from('81', 'hex'),
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
	} else {
		const flagBuf = Buffer.from('0001', 'hex');
		const segwitBuf = Buffer.concat(preparedInputs.map(({ pubkeyBuf }, i) => {
			const signature = signatures[i];
			const segwitScript = Buffer.concat([
				Buffer.from((signature.length + 1).toString(16), 'hex'),
				signature,
				Buffer.from('01', 'hex'),
				Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
				pubkeyBuf,
			]);
			return Buffer.concat([Buffer.from('02', 'hex'), segwitScript]);
		}));

		const inputsBuf = Buffer.concat(preparedInputs.map(({
			pubkeyBuf, preOutPointBuf, sequenceBuf
		}) => {
			return Buffer.concat([preOutPointBuf, Buffer.from('00', 'hex'), sequenceBuf]);
		}));

		return Buffer.concat([
			versionBuf,
			flagBuf,
			inputsCount,
			inputsBuf,
			outputsCount,
			outputsBuf,
			segwitBuf,
			lockTimeBuf,
		]);
	}
}

