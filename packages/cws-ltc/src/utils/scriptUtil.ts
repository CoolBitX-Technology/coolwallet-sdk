import { error, apdu, utils } from '@coolwallet/core';
import * as params from "../config/params";
import * as cryptoUtil from "./cryptoUtil";
import * as txUtil from "./transactionUtil";
import * as bufferUtil from "./bufferUtil";
import * as types from '../config/types';



export function getArgument(
  scriptType: types.ScriptType,
  inputs: Array<types.Input>,
  output: types.Output,
  change?: types.Change,
): string {
  const {
    scriptType: outputType,
    outScript: outputScript,
    outHash: outputHash
  } = txUtil.addressToOutScript(output.address);
  if (!outputHash) {
    throw new error.SDKError(getArgument.name, `OutputHash Undefined`);
  }
  let outputScriptType;
  let outputHashBuf;

  if (outputType == types.ScriptType.P2PKH) {
    outputScriptType = bufferUtil.toUintBuffer(0, 1);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else if (outputType == types.ScriptType.P2SH_P2WPKH) {
    outputScriptType = bufferUtil.toUintBuffer(1, 1);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else if (outputType == types.ScriptType.P2WPKH) {
    outputScriptType = bufferUtil.toUintBuffer(2, 1);
    outputHashBuf = Buffer.from(`000000000000000000000000${outputHash.toString('hex')}`, 'hex');
  } else {
    throw new error.SDKError(getArgument.name, `Unsupport ScriptType : ${outputType}`);
  }
  const outputAmount = bufferUtil.toNonReverseUintBuffer(output.value, 8);
  //[haveChange(1B)] [changeScriptType(1B)] [changeAmount(8B)] [changePath(21B)]
  let haveChange;
  let changeScriptType;
  let changeAmount;
  let changePath;
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(getArgument.name, 'Public Key not exists !!');
    haveChange = bufferUtil.toUintBuffer(1, 1);
    changeScriptType = bufferUtil.toUintBuffer(scriptType, 1);

    changeAmount = bufferUtil.toNonReverseUintBuffer(change.value, 8);
    const addressIdxHex = "00".concat(change.addressIndex.toString(16).padStart(6, "0"));
    // changePath = Buffer.from(`328000002C800000028000000000000000${addressIdxHex}`, 'hex');
    changePath = Buffer.from('32' + '8000002C' + params.COIN_TYPE + '80000000' + '00000000' + addressIdxHex, 'hex');
  } else {
    haveChange = Buffer.from('00', 'hex');
    changeScriptType = Buffer.from('00', 'hex');
    changeAmount = bufferUtil.toUintBuffer(0, 8)//)Buffer.from('0000000000000000', 'hex');
    changePath = bufferUtil.toUintBuffer(0, 21)//Buffer.from('000000000000000000000000000000000000000000', 'hex');
  }
  const prevouts = inputs.map(input => {
    return Buffer.concat([Buffer.from(input.preTxHash, 'hex').reverse(),
      bufferUtil.toUintBuffer(input.preIndex, 4)])
  })
  const hashPrevouts = cryptoUtil.hash256(Buffer.concat(prevouts));
  const sequences = inputs.map(input => {
    return Buffer.concat([
      (input.sequence) ? bufferUtil.toUintBuffer(input.sequence, 4) : Buffer.from('ffffffff', 'hex'),
      //Buffer.from(input.sequence, 'hex').reverse(),
      // toUintBuffer(input.preIndex, 4)
    ])
  })
  const hashSequence = cryptoUtil.hash256(Buffer.concat(sequences));

  const address = output.address
  let Maddress;
  if (address.startsWith('M')) {
    Maddress = Buffer.from('01', 'hex');
  } else {
    Maddress = Buffer.from('00', 'hex');
  }


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
    Maddress
  ]).toString('hex');
};


export function getScriptSigningActions(
  transport: types.Transport,
  scriptType: types.ScriptType,
  appId: string,
  appPrivateKey: string,
  inputs: Array<types.Input>,
  preparedData: types.PreparedData,
  output: types.Output,
  change: types.Change | undefined,
  coinType: string
): {
  preActions: Array<Function>,
  actions: Array<Function>
} {
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
      const SEPath = Buffer.from(`15${await utils.getPath(params.COIN_TYPE, preparedInput.addressIndex)}`, 'hex')
      const outPoint = preparedInput.preOutPointBuf;

      // let inputScriptType;
      // if ((scriptType == ScriptType.P2PKH) || (scriptType == ScriptType.P2WPKH) || (scriptType == ScriptType.P2SH_P2WPKH)) {
      // 	inputScriptType = toVarUintBuffer(0);
      // } else {//(scriptType == ScriptType.P2WSH)
      // 	inputScriptType = toVarUintBuffer(1);
      // }


      const inputScriptType = bufferUtil.toUintBuffer(0, 1);
      const inputAmount = preparedInput.preValueBuf.reverse();
      const inputHash = cryptoUtil.hash160(preparedInput.pubkeyBuf);
      return Buffer.concat([SEPath, outPoint, inputScriptType, inputAmount, inputHash]).toString('hex');
    });

  const actions = utxoArguments.map(
    (utxoArgument) => async () => {
      return apdu.tx.executeUtxoScript(transport, appId, appPrivateKey, await utxoArgument, (scriptType === types.ScriptType.P2PKH) ? "10" : "11");
    });
  return { preActions, actions };
};
