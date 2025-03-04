import { error } from '@coolwallet/core';
import * as types from '../config/types';
import * as bufferUtil from './bufferUtil';
const bs58check = require('bs58check');
const zencashjs = require('zencashjs');

export function addressToOutScript(address: string): {
  scriptType: types.ScriptType;
  outScript: Buffer;
  outHash: Buffer;
} {
  const decode = bs58check.decode(address);
  const prefix = decode.slice(0, 2).toString('hex');
  const outHash = decode.slice(2, decode.length);
  let scriptType, outScript;
  if (prefix === '2089') {
    scriptType = types.ScriptType.P2PKH;
    outScript = Buffer.from(`76a914${outHash.toString('hex')}88ac`, 'hex');
  } else if (prefix === '2096') {
    scriptType = types.ScriptType.P2SH;
    outScript = Buffer.from(`a914${outHash.toString('hex')}87`, 'hex');
  } else {
    throw new error.SDKError(addressToOutScript.name, `Invalid Address '${address}'`);
  }
  return { scriptType, outScript, outHash };
}

export function pubkeyToAddressAndOutScript(
  pubkey: Buffer,
  scriptType: types.ScriptType
): {
  address: string;
  outScript: Buffer;
  hash: Buffer;
} {
  if (scriptType !== types.ScriptType.P2PKH && scriptType !== types.ScriptType.P2SH) {
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
  }
  const address = zencashjs.address.pubKeyToAddr(pubkey);
  const { outScript, outHash } = addressToOutScript(address);
  return { address, outScript, hash: outHash };
}

export function createUnsignedTransactions(
  scriptType: types.ScriptType,
  inputs: Array<types.Input>,
  output: types.Output,
  change: types.Change | undefined,
  version: number = 1,
  lockTime: number = 0
): {
  preparedData: types.PreparedData;
  unsignedTransactions: Array<Buffer>;
} {
  const versionBuf = bufferUtil.toReverseUintBuffer(version, 4);
  const lockTimeBuf = bufferUtil.toReverseUintBuffer(lockTime, 4);
  const inputsCount = bufferUtil.toVarUintBuffer(inputs.length);
  const preparedInputs = inputs.map(({ preTxHash, preIndex, sequence, addressIndex, pubkeyBuf, scriptPubKey }) => {
    if (!pubkeyBuf) {
      throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
    }
    const preOutPointBuf = Buffer.concat([
      Buffer.from(preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(preIndex, 4),
    ]);
    const sequenceBuf = sequence ? bufferUtil.toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');
    let scriptLen;
    const scriptPubKeyBuf = Buffer.from(scriptPubKey, 'hex');
    if (scriptType == types.ScriptType.P2PKH) {
      scriptLen = 25;
    } else {
      scriptLen = 23;
    }

    const blockHashLen = parseInt(scriptPubKeyBuf[scriptLen].toString());
    const blockHashBuf = scriptPubKeyBuf.slice(scriptLen + 1, scriptLen + 1 + blockHashLen);
    const blockHeightLen = parseInt(scriptPubKeyBuf[scriptLen + 1 + blockHashLen].toString());
    const blockHeightBuf = scriptPubKeyBuf.slice(
      scriptLen + 1 + blockHashLen + 1,
      scriptLen + 1 + blockHashLen + 1 + blockHeightLen
    );
    return {
      addressIndex,
      pubkeyBuf,
      preOutPointBuf,
      sequenceBuf,
      blockHashBuf,
      blockHeightBuf,
    };
  });

  const { scriptType: outputType, outScript: outputScript } = addressToOutScript(output.address);

  const outValue = bufferUtil.toReverseUintBuffer(output.value, 8);
  const outBlockHashBuf = Buffer.from(output.blockHash, 'hex').reverse();
  const outBlockHeightBuf = bufferUtil.toVarUintBuffer(output.blockHeight).reverse();
  const outScriptPubKey = Buffer.concat([
    outputScript,
    bufferUtil.toVarUintBuffer(outBlockHashBuf.length),
    outBlockHashBuf,
    bufferUtil.toVarUintBuffer(outBlockHeightBuf.length),
    outBlockHeightBuf,
    Buffer.from('b4', 'hex'),
  ]);
  const outScriptPubKeyLen = bufferUtil.toVarUintBuffer(outScriptPubKey.length);
  const outputArray = [Buffer.concat([outValue, outScriptPubKeyLen, outScriptPubKey])];
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');

    const { outScript: changeScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, scriptType);
    const changeValue = bufferUtil.toReverseUintBuffer(change.value, 8);
    const changeBlockHashBuf = Buffer.from(change.blockHash, 'hex');
    const changeBlockHeightBuf = bufferUtil.toVarUintBuffer(change.blockHeight);
    const changeScriptPubKey = Buffer.concat([
      changeScript,
      bufferUtil.toVarUintBuffer(changeBlockHashBuf.length),
      changeBlockHashBuf.reverse(),
      bufferUtil.toVarUintBuffer(changeBlockHeightBuf.length),
      changeBlockHeightBuf.reverse(),
      Buffer.from('b4', 'hex'),
    ]);
    const changeScriptPubKeyLen = bufferUtil.toVarUintBuffer(changeScriptPubKey.length);
    outputArray.push(Buffer.concat([changeValue, changeScriptPubKeyLen, changeScriptPubKey]));
  }

  const outputsCount = bufferUtil.toVarUintBuffer(change ? 2 : 1);
  const outputsBuf = Buffer.concat(outputArray);

  const unsignedTransactions = preparedInputs.map(
    ({ pubkeyBuf, preOutPointBuf, sequenceBuf, blockHashBuf, blockHeightBuf }) => {
      const { outScript: preOutScriptBuf } = pubkeyToAddressAndOutScript(pubkeyBuf, scriptType);
      const fullInput = Buffer.concat([
        preOutScriptBuf,
        bufferUtil.toVarUintBuffer(blockHashBuf.length),
        blockHashBuf.reverse(),
        bufferUtil.toVarUintBuffer(blockHeightBuf.length),
        blockHeightBuf.reverse(),
        Buffer.from('b4', 'hex'),
      ]);
      //const fullInputLen =
      return Buffer.concat([
        versionBuf,
        bufferUtil.toVarUintBuffer(1),
        preOutPointBuf,
        bufferUtil.toVarUintBuffer(fullInput.length),
        fullInput,
        sequenceBuf,
        outputsCount,
        outputsBuf,
        lockTimeBuf,
        Buffer.from('81000000', 'hex'),
      ]);
    }
  );

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

export function composeFinalTransaction(
  scriptType: types.ScriptType,
  preparedData: types.PreparedData,
  signatures: Array<Buffer>
): Buffer {
  const { versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

  if (scriptType !== types.ScriptType.P2PKH && scriptType !== types.ScriptType.P2SH) {
    throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType '${scriptType}'`);
  }

  const inputsBuf = Buffer.concat(
    preparedInputs.map((data, i) => {
      const { pubkeyBuf, preOutPointBuf, sequenceBuf } = data;
      const signature = signatures[i];
      const inScript = Buffer.concat([
        Buffer.from((signature.length + 1).toString(16), 'hex'),
        signature,
        Buffer.from('81', 'hex'),
        Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
        pubkeyBuf,
      ]);
      return Buffer.concat([preOutPointBuf, bufferUtil.toVarUintBuffer(inScript.length), inScript, sequenceBuf]);
    })
  );
  return Buffer.concat([versionBuf, inputsCount, inputsBuf, outputsCount, outputsBuf, lockTimeBuf]);
}
