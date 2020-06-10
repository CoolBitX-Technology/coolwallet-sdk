import BN from 'bn.js';
import { core, apdu } from '@coolwallets/core';
import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuint';
import * as scripts from "./scripts";
import { handleHex } from "./string_util";
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
type Transport = import("@coolwallets/transport").default;

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

	getScriptAndArguments,
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

function toVarUintBuffer(int: number): Buffer {
	return varuint.encode(int);
}

function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
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
	const outScript = payment.output;
	return { scriptType, outScript };
}

function pubkeyToAddressAndOutScript(pubkey: Buffer, scriptType: ScriptType)
	: { address: string, outScript: Buffer } {
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
	if (!payment.output) throw new Error(`No OutScript for ScriptType : ${scriptType}`);
	return { address: payment.address, outScript: payment.output };
}

function createUnsignedTransactions(
	scriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	change: Change | undefined,
	version: number = 1,
	lockTime: number = 0,
): ({
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>
}) {
	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2WPKH
		&& scriptType !== ScriptType.P2SH_P2WPKH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}

	const versionBuf = toUintBuffer(version, 4);
	const lockTimeBuf = toUintBuffer(lockTime, 4);

	const inputsCount = toVarUintBuffer(inputs.length);
	const preparedInputs = inputs.map(({
		preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf
	}) => {
		if (!pubkeyBuf) throw new Error('Public Key not exists !!');

		const preOutPointBuf = Buffer.concat([
			Buffer.from(preTxHash, 'hex').reverse(),
			toUintBuffer(preIndex, 4),
		]);

		const preValueBuf = toUintBuffer(preValue, 8);
		const sequenceBuf = (sequence) ? toUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

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
		Buffer.concat([toUintBuffer(output.value, 8), outputScriptLen, outputScript])
	];
	if (change) {
		if (!change.pubkeyBuf) throw new Error('Public Key not exists !!');
		const changeValue = toUintBuffer(change.value, 8);
		const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, scriptType);
		const outScriptLen = toVarUintBuffer(outScript.length);
		outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
	}

	const outputsCount = toVarUintBuffer((change) ? 2 : 1);
	const outputsBuf = Buffer.concat(outputArray);

	const hashPrevouts = hash256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
	const hashSequence = hash256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
	const hashOutputs = hash256(outputsBuf);

	const unsignedTransactions = preparedInputs.map(({
		pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf
	}) => {
		if (scriptType === ScriptType.P2PKH) {
			const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, ScriptType.P2PKH);
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
		}
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

): ({ preActions: Array<Function>, actions: Array<Function> }) {
	const preActions = [];

	if (change) {
		const changeAction = async () => {
			const cmd = 'SET_CHANGE_KEYID';
			if (scriptType === ScriptType.P2WPKH) throw new Error('not support P2WPKH change');
			const redeemType = (scriptType === ScriptType.P2PKH) ? '00' : '01';
			const keyId = change.addressIndex.toString(16).padStart(10, '0');
			const sig = await core.auth.getCommandSignature(
				transport, appId, appPrivateKey, cmd, keyId, redeemType
			);
			const pathWithSig = keyId + sig.signature;
			await apdu.tx.setChangeKeyId(transport, pathWithSig, redeemType);
		};
		preActions.push(changeAction);
	}

	const parsingOutputAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		const txDataType = (preparedData.outputType === ScriptType.P2WPKH) ? '0C' : '01';
		return core.util.prepareOutputData(transport, txDataHex, txDataType);
	};
	preActions.push(parsingOutputAction);

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = core.util.addressIndexToKeyId('00', preparedData.preparedInputs[i].addressIndex);
		const readType = '01';
		const txDataHex = core.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return core.util.prepareTx(transport, txDataHex, txDataType, appPrivateKey);
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
		&& scriptType !== ScriptType.P2WPKH
		&& scriptType !== ScriptType.P2SH_P2WPKH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
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
	}

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
		if (scriptType === ScriptType.P2SH_P2WPKH) {
			const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, ScriptType.P2WPKH);
			const inScript = Buffer.concat([
				Buffer.from(outScript.length.toString(16), 'hex'),
				outScript,
			]);
			return Buffer.concat([
				preOutPointBuf, toVarUintBuffer(inScript.length), inScript, sequenceBuf
			]);
		}
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

function getArgument(
	scriptType: ScriptType,
	payment: Array<Input>
) {
	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2WPKH
		&& scriptType !== ScriptType.P2SH_P2WPKH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	let argument =
		handleHex("");

	//handleHex(payment.Flags.toString(16).padStart(8, "0"));
	return argument;
};

function getScriptAndArguments(
	scriptType: ScriptType,
	inputs: Array<Input>,
	output: Output,
	change: Change | undefined,
	version: number = 1,
	lockTime: number = 0, )
	: { script: string, argument: string } {

	let script;
	let argument;

	script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
	argument = getArgument(scriptType, inputs);
	return {
		script,
		argument,
	};
};
