import BN from 'bn.js';
import { error } from '@coolwallet/core';
import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuint';
import {
	ScriptType, OmniType, Input, Output, Change, PreparedData
} from './types';

export {
	pubkeyToAddressAndOutScript,
	addressToOutScript,
	createUnsignedTransactions,
	composeFinalTransaction,
};

function hash160(buf: Buffer): Buffer {
	return bitcoin.crypto.hash160(buf);
}

function doubleSha256(buf: Buffer): Buffer {
	return bitcoin.crypto.hash256(buf);
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

function addressToOutScript(address: string): ({ scriptType: ScriptType, outScript: Buffer, outHash?: Buffer }) {
	let scriptType;
	let payment;
	if (address.startsWith('1')) {
		scriptType = ScriptType.P2PKH;
		payment = bitcoin.payments.p2pkh({ address });
	} else if (address.startsWith('3')) {
		scriptType = ScriptType.P2SH_P2WPKH;
		payment = bitcoin.payments.p2sh({ address });
	} else if (address.startsWith('bc1')) {
		scriptType = ScriptType.P2WPKH;
		payment = bitcoin.payments.p2wpkh({ address });
	} else {
		throw new error.SDKError(addressToOutScript.name, `Unsupport Address '${address}'`);
	}
	if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address '${address}'`);
	const outScript = payment.output;
	const outHash = payment.hash;
	return { scriptType, outScript, outHash };
}

function pubkeyToAddressAndOutScript(pubkey: Buffer, scriptType: ScriptType)
	: { address: string, outScript: Buffer, hash: Buffer } {
	let payment;
	if (scriptType === ScriptType.P2PKH) {
		payment = bitcoin.payments.p2pkh({ pubkey });
	} else if (scriptType === ScriptType.P2SH_P2WPKH) {
		payment = bitcoin.payments.p2sh({
			redeem: bitcoin.payments.p2wpkh({ pubkey }),
		});
	} else if (scriptType === ScriptType.P2WPKH) {
		payment = bitcoin.payments.p2wpkh({ pubkey });
	} else {
		throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
	}
	if (!payment.address) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
	if (!payment.output) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
	if (!payment.hash) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
	return { address: payment.address, outScript: payment.output, hash: payment.hash };
}

function createUnsignedTransactions(
	redeemScriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	change: Change | undefined,
	omniType?: OmniType,
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
		if (!pubkeyBuf) {
			throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
		}
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


	/*const outputArray = [
		Buffer.concat([toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])
	];*/
	let outputArray;
	if (!omniType) {
		outputArray = [
			Buffer.concat([toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])
		];
	} else {
		const omni = Buffer.concat([
			Buffer.from('omni', 'ascii'),
			toUintBuffer(0, 2), // Transaction version
			toUintBuffer(0, 2), // Transaction type	
			toUintBuffer(omniType, 4), // Currency identifier
			toUintBuffer(output.value, 8)
		]);
		const omniLen = toVarUintBuffer(omni.length);
		const omniScript = Buffer.concat([
			Buffer.from('6a', 'hex'), // OP_RETURN
			omniLen,
			omni
		]);
		const omniScriptLen = toVarUintBuffer(omniScript.length);
		outputArray = [
			Buffer.concat([toReverseUintBuffer(546, 8), outputScriptLen, outputScript,
			toUintBuffer(0, 8), omniScriptLen, omniScript])
		];
	}
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
		const changeValue = toReverseUintBuffer(change.value, 8);
		const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, redeemScriptType);
		const outScriptLen = toVarUintBuffer(outScript.length);
		outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
	}

	const outputsCount = toVarUintBuffer((change) ? 2 : 1);
	const outputsBuf = Buffer.concat(outputArray);

	const hashPrevouts = doubleSha256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
	const hashSequence = doubleSha256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
	const hashOutputs = doubleSha256(outputsBuf);

	const unsignedTransactions = preparedInputs.map(({
		pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf
	}) => {
		if (redeemScriptType === ScriptType.P2PKH) {
			const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, redeemScriptType);
			const outScriptLen = toVarUintBuffer(outScript.length);
			return Buffer.concat([
				versionBuf,
				toVarUintBuffer(1),
				preOutPointBuf,
				outScriptLen, // preOutScriptBuf
				outScript, // preOutScriptBuf
				sequenceBuf,
				outputsCount,
				outputsBuf,
				lockTimeBuf,
				Buffer.from('81000000', 'hex'),
			]);
		} else {
			return Buffer.concat([
				versionBuf,
				hashPrevouts,
				hashSequence,
				preOutPointBuf,
				Buffer.from(`1976a914${hash160(pubkeyBuf).toString('hex')}88ac`, 'hex'), // ScriptCode
				preValueBuf,
				sequenceBuf,
				hashOutputs,
				lockTimeBuf,
				Buffer.from('01000000', 'hex'),
			]);
		}
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
	redeemScriptType: ScriptType,
	preparedData: PreparedData,
	signatures: Array<Buffer>
): Buffer {
	const {
		versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf
	} = preparedData;

	if ((redeemScriptType !== ScriptType.P2PKH) &&
		(redeemScriptType !== ScriptType.P2WPKH) &&
		(redeemScriptType !== ScriptType.P2SH_P2WPKH)) {
		throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
	}

	if (redeemScriptType === ScriptType.P2PKH) {
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
			if (redeemScriptType === ScriptType.P2SH_P2WPKH) {
				const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, ScriptType.P2WPKH);
				const inScript = Buffer.concat([
					Buffer.from(outScript.length.toString(16), 'hex'),
					outScript,
				]);
				return Buffer.concat([
					preOutPointBuf, toVarUintBuffer(inScript.length), inScript, sequenceBuf
				]);
			} else {
				return Buffer.concat([preOutPointBuf, Buffer.from('00', 'hex'), sequenceBuf]);
			}
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

