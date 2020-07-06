import BN from 'bn.js';
import { transport, apdu, tx, error } from '@coolwallet/core';
import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuint';
import * as scripts from "../scripts";
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
type Transport = transport.default;

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
	getScriptAndArgument,
	getUtxoArguments
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
	if (lenR === 0) throw new error.SDKError(bip66Encode.name, 'R length is zero');
	if (lenS === 0) throw new error.SDKError(bip66Encode.name, 'S length is zero');
	if (lenR > 33) throw new error.SDKError(bip66Encode.name,'R length is too long');
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
		throw new error.SDKError(addressToOutScript.name, `Unsupport Address : ${address}`);
	}
	if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address : ${address}`);
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
		throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType : ${scriptType}`);
	}
	if (!payment.address) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType : ${scriptType}`);
	if (!payment.output) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType : ${scriptType}`);
	if (!payment.hash) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType : ${scriptType}`);
	return { address: payment.address, outScript: payment.output, hash: payment.hash };
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
	const versionBuf = toUintBuffer(version, 4);
	const lockTimeBuf = toUintBuffer(lockTime, 4);

	const inputsCount = toVarUintBuffer(inputs.length);
	const preparedInputs = inputs.map(({
		preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf
	}) => {
		if (!pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');

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
		if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
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
			const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, scriptType);
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
			if (scriptType === ScriptType.P2WPKH) {
				throw new error.SDKError(getSigningActions.name, 'not support P2WPKH change');
			} else {
				const redeemType = (scriptType === ScriptType.P2PKH) ? '00' : '01';
				await apdu.tx.setChangeKeyid(transport, appId, appPrivateKey, '00', change.addressIndex, redeemType);
			}
		}
		preActions.push(changeAction);
	}

	const parsingOutputAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		const txDataType = (preparedData.outputType === ScriptType.P2WPKH) ? '0C' : '01';
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
		throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType : ${scriptType}`);
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
			if (scriptType === ScriptType.P2SH_P2WPKH) {
				const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, scriptType);
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
	} else if (outputType == ScriptType.P2SH_P2WPKH) {
		outputScriptType = toUintBuffer(1, 1);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == ScriptType.P2WPKH) {
		outputScriptType = toUintBuffer(2, 1);
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
	const hashPrevouts = hash256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? toUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
			//Buffer.from(input.sequence, 'hex').reverse(),
			toUintBuffer(input.preIndex, 4)
		])
	})
	const hashSequence = hash256(Buffer.concat(sequences));

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
