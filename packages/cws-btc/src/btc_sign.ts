import {
	hash160,
	hash256,
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	toVarUintBuffer,
	toUintBuffer,
	addressToOutScript,
	pubkeyToAddressAndOutScript,
} from './utils';

export {
	createUnsignedTransactions,
	composeFinalTransaction,
};

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

function composeFinalTransaction(
	scriptType: ScriptType,
	preparedData: PreparedData,
	derSigAndHashTypes: Array<Buffer>
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
			const signature = derSigAndHashTypes[i];
			const inScript = Buffer.concat([
				Buffer.from(signature.length.toString(16), 'hex'),
				signature,
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
		const signature = derSigAndHashTypes[i];
		const segwitScript = Buffer.concat([
			Buffer.from(signature.length.toString(16), 'hex'),
			signature,
			Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
			pubkeyBuf,
		]);
		return Buffer.concat([Buffer.from('02', 'hex'), segwitScript]);
	}));

	const inputsBuf = Buffer.concat(preparedInputs.map(({
		pubkeyBuf, preOutPointBuf, sequenceBuf
	}) => {
		if (scriptType === ScriptType.P2SH_P2WPKH) {
			const { outScript: inScript } = pubkeyToAddressAndOutScript(pubkeyBuf, ScriptType.P2WPKH);
			const inScriptLen = toVarUintBuffer(inScript.length);
			return Buffer.concat([
				preOutPointBuf, toVarUintBuffer(inScript.length), inScriptLen, inScript, sequenceBuf
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
