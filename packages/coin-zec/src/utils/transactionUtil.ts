import { error } from '@coolwallet/core';
import * as bufferUtil from './bufferUtil';
import * as params from '../config/params';
import * as bitcoin from 'bitcoinjs-lib';
import bs58check from 'bs58check';
import * as types from '../config/types';

export function addressToOutScript(address: string): {
  scriptType: types.ScriptType;
  outScript: Buffer;
  outHash?: Buffer;
} {
  let scriptType;
  let payment;
  const decoded = bs58check.decode(address);
  if (decoded.length !== 22) {
    throw new error.SDKError(addressToOutScript.name, `Invalid Address '${address}'`);
  }
  const version = decoded.subarray(0, 2);
  const hash = decoded.subarray(2);

  if (version.equals(params.ZCASH_P2PKH_PREFIX)) {
    scriptType = types.ScriptType.P2PKH;
    payment = bitcoin.payments.p2pkh({ hash });
  } else if (version.equals(params.ZCASH_P2SH_PREFIX)) {
    scriptType = types.ScriptType.P2SH;
    payment = bitcoin.payments.p2sh({ hash });
  } else {
    throw new error.SDKError(addressToOutScript.name, `Unsupport Address '${address}'`);
  }

  if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address '${address}'`);
  const outScript = payment.output;
  const outHash = payment.hash ?? hash;
  return { scriptType, outScript, outHash };
}

export function pubkeyToAddressAndOutScript(
  burPublicKey: Buffer,
  scriptType: types.ScriptType
): { address: string; outScript: Buffer; hash: Buffer } {
  const input = {
    pubkey: burPublicKey,
  };

  let payment;
  if (scriptType === types.ScriptType.P2PKH) {
    payment = bitcoin.payments.p2pkh(input);
  } else if (scriptType === types.ScriptType.P2SH) {
    const redeem = bitcoin.payments.p2pkh(input);
    payment = bitcoin.payments.p2sh({ redeem });
  } else {
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
  }
  if (!payment.hash)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
  if (!payment.output)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
  const address =
    scriptType === types.ScriptType.P2PKH
      ? bs58check.encode(Buffer.concat([params.ZCASH_P2PKH_PREFIX, payment.hash]))
      : bs58check.encode(Buffer.concat([params.ZCASH_P2SH_PREFIX, payment.hash]));
  return { address, outScript: payment.output, hash: payment.hash };
}

export function createUnsignedTransactions(
  scriptType: types.ScriptType,
  inputs: Array<types.Input>,
  output: types.Output,
  change: types.Change | undefined,
  lockTime = 0
): {
  preparedData: types.PreparedData;
} {
  const lockTimeBuf = bufferUtil.toUintBuffer(lockTime, 4);

  const preparedInputs = inputs.map(({ preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf }) => {
    if (!pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');

    const preOutPointBuf = Buffer.concat([
      Buffer.from(preTxHash, 'hex').reverse(),
      bufferUtil.toUintBuffer(preIndex, 4),
    ]);

    const preValueBuf = bufferUtil.toUintBuffer(preValue, 8);
    const sequenceBuf = sequence ? bufferUtil.toUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

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

  const outputArray = [Buffer.concat([bufferUtil.toUintBuffer(output.value, 8), outputScriptLen, outputScript])];

  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
    const changeValue = bufferUtil.toUintBuffer(change.value, 8);
    const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, scriptType);
    const outScriptLen = bufferUtil.toVarUintBuffer(outScript.length);
    outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
  }

  const outputsCount = bufferUtil.toVarUintBuffer(change ? 2 : 1);
  const outputsBuf = Buffer.concat(outputArray);

  return {
    preparedData: {
      preparedInputs,
      outputType,
      outputsCount,
      outputsBuf,
      lockTimeBuf,
    },
  };
}

export function composeFinalTransaction(
  txVersion: params.txVersion,
  scriptType: types.ScriptType,
  preparedData: types.PreparedData,
  signatures: Array<Buffer>
): Buffer {
  const { preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

  if (scriptType !== types.ScriptType.P2PKH) {
    throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType : ${scriptType}`);
  }
  const versionBuf = bufferUtil.toUintBuffer(params.ZcashTxVersion[txVersion], 4);
  const groupIdBuf = bufferUtil.toUintBuffer(params.ZcashGroupId[txVersion], 4);
  const inputsCount = bufferUtil.toVarUintBuffer(preparedInputs.length); // ??

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

  const expiryBuffer = Buffer.alloc(4, 0);
  const valueBalanceBuf = Buffer.alloc(8, 0);
  const shieldedSpends = Buffer.alloc(1, 0);
  const shieldedOutputs = Buffer.alloc(1, 0);
  const joinSplits = Buffer.alloc(1, 0);

  return Buffer.concat([
    versionBuf,
    groupIdBuf,
    inputsCount,
    inputsBuf,
    outputsCount,
    outputsBuf,
    lockTimeBuf,
    expiryBuffer,
    valueBalanceBuf,
    shieldedSpends,
    shieldedOutputs,
    joinSplits,
  ]);
}
