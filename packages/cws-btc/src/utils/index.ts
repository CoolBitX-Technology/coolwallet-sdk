import BN from 'bn.js';
import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuint';
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';

export {
	hash160,
	hash256,
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	encodeDerSig,
	toVarUintPrefixedBuffer,
	toVarUintBuffer,
	toUintBuffer,
	addressToOutScript,
	pubkeyToOutScript,
	pubkeyToAddress,
};

function hash160(buf: Buffer): Buffer {
	return bitcoin.crypto.hash160(buf);
}

function hash256(buf: Buffer): Buffer {
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
	if (lenR === 0) throw new Error('R length is zero');
	if (lenS === 0) throw new Error('S length is zero');
	if (lenR > 33) throw new Error('R length is too long');
	if (lenS > 33) throw new Error('S length is too long');
	if (r[0] & 0x80) throw new Error('R value is negative');
	if (s[0] & 0x80) throw new Error('S value is negative');
	if (lenR > 1 && (r[0] === 0x00) && !(r[1] & 0x80)) throw new Error('R value excessively padded');
	if (lenS > 1 && (s[0] === 0x00) && !(s[1] & 0x80)) throw new Error('S value excessively padded');

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

function toVarUintPrefixedBuffer(buf: Buffer): Buffer {
	return Buffer.concat([varuint.encode(buf.length), buf]);
}

function toVarUintBuffer(int: number): Buffer {
	return varuint.encode(int);
}

function toUintBuffer(numberOrString: number|string, byteSize: number): Buffer {
	const bn = new BN(numberOrString);
	const buf = Buffer.from(bn.toArray()).reverse();
	return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

function addressToOutScript(address: string): ({ scriptType: ScriptType, outScript: Buffer }) {
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
		throw new Error(`Unsupport Address : ${address}`);
	}
	if (!payment.output) throw new Error(`No OutScript for Address : ${address}`);
	const outScript = toVarUintPrefixedBuffer(payment.output);
	return { scriptType, outScript };
}

function pubkeyToOutScript(pubkey: Buffer, scriptType: ScriptType): Buffer {
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
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	if (!payment.output) throw new Error(`No OutScript for ScriptType : ${scriptType}`);
	return toVarUintPrefixedBuffer(payment.output);
}

function pubkeyToAddress(pubkey: Buffer, scriptType: ScriptType): string {
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
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	if (!payment.address) throw new Error(`No Address for ScriptType : ${scriptType}`);
	return payment.address;
}
