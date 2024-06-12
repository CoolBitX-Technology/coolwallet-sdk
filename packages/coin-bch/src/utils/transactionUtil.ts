import * as cryptoUtil from './cryptoUtil';
import * as bufferUtil from './bufferUtil';
import * as types from '../config/types';
const bitcore = require('bitcore-lib-cash');
const bchaddr = require('bchaddrjs');

export function addressToOutScript(address: string): {
  scriptType: types.ScriptType;
  outScript: Buffer;
  outHash: Buffer;
} {
  if (!bchaddr.isValidAddress(address)) {
    throw new Error(`Unsupport Address : ${address}`);
  }
  let addrBuf;
  if (bchaddr.isCashAddress(address)) {
    addrBuf = bitcore.Address.fromString(address).toBuffer();
  } else {
    addrBuf = bitcore.encoding.Base58Check.decode(address);
  }
  if (addrBuf.length !== 21) {
    throw new Error(`Unsupport script hash : ${addrBuf.toString('hex')}`);
  }
  const outHash = addrBuf.slice(1, 21);
  let outScript;
  let scriptType;
  if (bchaddr.isP2PKHAddress(address)) {
    scriptType = types.ScriptType.P2PKH;
    outScript = Buffer.from(`76a914${outHash.toString('hex')}88ac`, 'hex');
  } else {
    scriptType = types.ScriptType.P2SH;
    outScript = Buffer.from(`a914${outHash.toString('hex')}87`, 'hex');
  }
  return { scriptType, outScript, outHash };
}

export function pubkeyToAddressAndOutScript(pubkey: Buffer): {
  address: string;
  outScript: Buffer;
} {
  const Address = bitcore.Address;
  const PublicKey = bitcore.PublicKey;
  const pubkeyObj = new PublicKey(pubkey);
  const addressObj = Address.fromPublicKey(pubkeyObj);

  const outScript = Buffer.from(`76a914${cryptoUtil.hash160(pubkey).toString('hex')}88ac`, 'hex');
  return { address: addressObj.toCashAddress(), outScript };
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
  const preparedInputs = inputs.map(({ preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf }) => {
    if (!pubkeyBuf) throw new Error('Public Key not exists !!');

    const preOutPointBuf = Buffer.concat([
      Buffer.from(preTxHash, 'hex').reverse(),
      bufferUtil.toReverseUintBuffer(preIndex, 4),
    ]);

    const preValueBuf = bufferUtil.toReverseUintBuffer(preValue, 8);
    const sequenceBuf = sequence ? bufferUtil.toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

    return {
      addressIndex,
      pubkeyBuf,
      preOutPointBuf,
      preValueBuf,
      sequenceBuf,
    };
  });

  const { scriptType: outputType, outScript: outputScript } = addressToOutScript(output.address);
  const outputScriptLen = bufferUtil.toVarUintBuffer(outputScript.length);

  const outputArray = [Buffer.concat([bufferUtil.toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])];
  if (change) {
    if (!change.pubkeyBuf) throw new Error('Public Key not exists !!');
    const changeValue = bufferUtil.toReverseUintBuffer(change.value, 8);
    const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf);
    const outScriptLen = bufferUtil.toVarUintBuffer(outScript.length);
    outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
  }

  const outputsCount = bufferUtil.toVarUintBuffer(change ? 2 : 1);
  const outputsBuf = Buffer.concat(outputArray);

  const hashPrevouts = cryptoUtil.doubleHash256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
  const hashSequence = cryptoUtil.doubleHash256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
  const hashOutputs = cryptoUtil.doubleHash256(outputsBuf);

  const unsignedTransactions = preparedInputs.map(({ pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf }) => {
    let scriptCode;
    if (scriptType === types.ScriptType.P2PKH) {
      scriptCode = Buffer.from(`1976a914${cryptoUtil.hash160(pubkeyBuf).toString('hex')}88ac`, 'hex');
    } else {
      //P2SH
      scriptCode = Buffer.from(`17a914${cryptoUtil.hash160(pubkeyBuf).toString('hex')}87`, 'hex');
    }

    return Buffer.concat([
      versionBuf,
      hashPrevouts,
      hashSequence,
      preOutPointBuf,
      scriptCode,
      preValueBuf,
      sequenceBuf,
      hashOutputs,
      lockTimeBuf,
      Buffer.from('41000000', 'hex'),
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

export function composeFinalTransaction(
  scriptType: types.ScriptType,
  preparedData: types.PreparedData,
  signatures: Array<Buffer>
): Buffer {
  const { versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

  if (scriptType !== types.ScriptType.P2PKH && scriptType !== types.ScriptType.P2SH) {
    throw new Error(`Unsupport ScriptType : ${scriptType}`);
  }
  const inputsBuf = Buffer.concat(
    preparedInputs.map((data, i) => {
      const { pubkeyBuf, preOutPointBuf, sequenceBuf } = data;
      const signature = signatures[i];
      const inScript = Buffer.concat([
        Buffer.from((signature.length + 1).toString(16), 'hex'),
        signature,
        Buffer.from('41', 'hex'),
        Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
        pubkeyBuf,
      ]);
      return Buffer.concat([preOutPointBuf, bufferUtil.toVarUintBuffer(inScript.length), inScript, sequenceBuf]);
    })
  );
  return Buffer.concat([versionBuf, inputsCount, inputsBuf, outputsCount, outputsBuf, lockTimeBuf]);
}
