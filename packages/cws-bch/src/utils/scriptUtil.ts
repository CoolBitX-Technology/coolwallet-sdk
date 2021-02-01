import { tx, apdu, utils } from '@coolwallet/core';
import * as txUtil from './transactionUtil';
import * as cryptoUtil from "./cryptoUtil";
import * as bufferUtil from "./bufferUtil";
import * as types from '../config/types';
import * as params from '../config/params';

export async function getArgument(
  inputs: Array<types.Input>,
  output: types.Output,
  change?: types.Change,
): Promise<string> {
  const {
    scriptType: outputType,
    outHash: outputHash
  } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new Error(`OutputHash Undefined`);
  }
  let outputScriptType;
  let outputHashBuf;
  outputScriptType = bufferUtil.toVarUintBuffer(outputType);
  outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');

  const outputAmount = bufferUtil.toUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) {
      throw new Error('Public Key not exists !!');
    }
    haveChange = bufferUtil.toVarUintBuffer(1);
    changeScriptType = bufferUtil.toVarUintBuffer(outputType);
    changeAmount = bufferUtil.toUintBuffer(change.value, 8);
    // const addressIdHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
    changePath = Buffer.from(await utils.getPath(params.COIN_TYPE, change.addressIndex), 'hex');
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8)//)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21)//Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }
  const prevouts = inputs.map(input => {
    return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(input.preIndex, 4)])
  })
  const hashPrevouts = cryptoUtil.doubleHash256(Buffer.concat(prevouts));
  const sequences = inputs.map(input => {
    return Buffer.concat([
      (input.sequence) ? bufferUtil.toReverseUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
    ])
  })
  const hashSequence = cryptoUtil.doubleHash256(Buffer.concat(sequences));

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

export async function getScriptSigningActions(
  transport: types.Transport,
  scriptType: types.ScriptType,
  appId: string,
  appPrivateKey: string,
  inputs: Array<types.Input>,
  preparedData: types.PreparedData,
  output: types.Output,
  change: types.Change | undefined
): Promise<{
  preActions: Array<Function>,
  actions: Array<Function>
}> {
  const script = params.TRANSFER.script + params.TRANSFER.signature;
  const argument = "00" + await getArgument(inputs, output, change);// keylength zero

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
      // const SEPath = Buffer.from(`15328000002C${params.COIN_TYPE}8000000000000000${addressIdHex}`, 'hex')
      const SEPath = Buffer.from(`15${await utils.getPath(params.COIN_TYPE, preparedInput.addressIndex)}`, 'hex')
      const outPoint = preparedInput.preOutPointBuf;
      let inputScriptType;
      if (scriptType == types.ScriptType.P2PKH) {
        inputScriptType = bufferUtil.toVarUintBuffer(0);
      } else {//scriptType == ScriptType.P2SH
        inputScriptType = bufferUtil.toVarUintBuffer(1);
      }
      const inputAmount = preparedInput.preValueBuf.reverse();
      const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
      return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
    });

  const actions = utxoArguments.map(
    (utxoArgument) => async () => {
      return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, await utxoArgument, "12");
    });
  return { preActions, actions };
};
