import { apdu, error, utils } from '@coolwallet/core';
import * as params from "../config/params";
import * as bufferUtil from './bufferUtil';
import * as types from '../config/types';
import * as  txUtil from './transactionUtil';
import * as cryptoUtil from './cryptoUtil';


function getArgument(
	scriptType: types.ScriptType,
	inputs: Array<types.Input>,
	output: types.Output,
	change?: types.Change,
): string {
	const {
		scriptType: outputType,
		outHash: outputHash
	} = txUtil.addressToOutScript(output.address);
	if (!outputHash) {
		throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
	}
	let outputScriptType;
	let outputHashBuf;
	//[outputScriptType(1B)] [outputAmount(8B)] [outputHash(12+20B)] [outputBlockHash(32B)] [outputBlockHeight(3B)] 
	if (outputType == types.ScriptType.P2PKH) {
		outputScriptType = bufferUtil.toVarUintBuffer(0);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else if (outputType == types.ScriptType.P2SH) {
		outputScriptType = bufferUtil.toVarUintBuffer(1);
		outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
	} else {
		throw new error.SDKError(getArgument.name, `Unsupport ScriptType : ${outputType}`);
	}
	const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
	const outputBlockHash = bufferUtil.hexStringToUintBuffer(output.blockHash, 32).reverse();
	const outputBlockHeight = bufferUtil.toReverseUintBuffer(output.blockHeight, 3);
	//[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)] [changeBlockHash(32B)] [changeBlockHeight(3B)]
	let haveChange;
	let changeScriptType;
	let changeAmount;
	let changePath;
	let changeBlockHash;
	let changeBlockHeight;
	if (change) {
		if (!change.pubkeyBuf) throw new error.SDKError(getArgument.name, 'Public Key not exists !!');
		haveChange = bufferUtil.toVarUintBuffer(1);
		changeScriptType = bufferUtil.toVarUintBuffer(scriptType);
		changeAmount = bufferUtil.toUintBuffer(change.value, 8);
		const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
		changePath = Buffer.from(`328000002C${params.COIN_TYPE}8000000000000000${addressIdxHex}`, 'hex');
		changeBlockHash = bufferUtil.hexStringToUintBuffer(change.blockHash, 32).reverse();
		changeBlockHeight = bufferUtil.toReverseUintBuffer(change.blockHeight, 3);
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
		bufferUtil.toReverseUintBuffer(input.preIndex, 4)])
	})
	const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(prevouts));
	const sequences = inputs.map(input => {
		return Buffer.concat([
			(input.sequence) ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
			bufferUtil.toReverseUintBuffer(input.preIndex, 4)
		])
	})
	const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(sequences));

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

export async function getScriptSigningActions(
	transport: types.Transport,
	scriptType: types.ScriptType,
	appId: string,
	appPrivateKey: string,
	inputs: Array<types.Input>,
	preparedData: types.PreparedData,
	output: types.Output,
	change: types.Change | undefined
): Promise<{ preActions: Array<Function>, actions: Array<Function> }> {
	const script = params.TRANSFER.script + params.TRANSFER.signature;
	const argument = "00" + getArgument(scriptType, inputs, output, change);// keylength zero

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
		async (preparedInput) => {
			// const addressIdHex = "00".concat(preparedInput.addressIndex.toString(16).padStart(6, "0"));

			const SEPath = Buffer.concat([Buffer.from('15', 'hex'), Buffer.from(await utils.getPath(params.COIN_TYPE, preparedInput.addressIndex), 'hex')])
			console.debug("SEPath: " + SEPath.toString('hex'))

			//[outPoint(32+4B)] [inputScriptType(1B)] [inputAmount(8B)] [inputHash(20B)] [inputBlockHash(32B)] [inputBlockHeight(3B)]
			const outPoint = preparedInput.preOutPointBuf;
			let inputScriptType;
			if (scriptType == types.ScriptType.P2PKH) {
				inputScriptType = bufferUtil.toVarUintBuffer(0);
			} else {//(scriptType == ScriptType.P2SH)
				inputScriptType = bufferUtil.toVarUintBuffer(1);
			}
			const inputAmount = Buffer.from('0000000000000000', 'hex');
			const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
			const inputBlockHash = preparedInput.blockHashBuf.reverse();
			const inputBlockHeight = preparedInput.blockHeightBuf.reverse();
			return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash, inputBlockHash, inputBlockHeight]).toString('hex');
		});


	const actions = utxoArguments.map(
		(utxoArgument) => async () => {
			return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, await utxoArgument, "13");
		});
	return { preActions, actions };
};
