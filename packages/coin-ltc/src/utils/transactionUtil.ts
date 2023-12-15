import { error } from '@coolwallet/core';
import * as bufferUtil from './bufferUtil';
import * as cryptoUtil from './cryptoUtil';
import * as params from '../config/params';
import * as bitcoin from 'bitcoinjs-lib';
import * as types from '../config/types';

export function addressToOutScript(address: string): {
  scriptType: types.ScriptType;
  outScript: Buffer;
  outHash?: Buffer;
} {
  const input = {
    address: address,
    network: params.activeNet,
  };
  let scriptType;
  let payment;
  if (address.startsWith('L')) {
    scriptType = types.ScriptType.P2PKH;
    payment = bitcoin.payments.p2pkh(input);
  } else if (address.startsWith('M')) {
    scriptType = types.ScriptType.P2SH_P2WPKH;
    payment = bitcoin.payments.p2sh(input);
  } else if (address.startsWith('ltc')) {
    scriptType = types.ScriptType.P2WPKH;
    payment = bitcoin.payments.p2wpkh(input);
  } else {
    throw new error.SDKError(addressToOutScript.name, `Unsupport Address '${address}'`);
  }

  if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address '${address}'`);
  const outScript = payment.output;
  const outHash = payment.hash;
  console.debug(payment);
  return { scriptType, outScript, outHash };
}

export function pubkeyToAddressAndOutScript(
  burPublicKey: Buffer,
  scriptType: types.ScriptType
): { address: string; outScript: Buffer; hash: Buffer } {
  const input = {
    pubkey: burPublicKey,
    network: params.activeNet,
  };

  let payment;
  if (scriptType === types.ScriptType.P2PKH) {
    payment = bitcoin.payments.p2pkh(input);
  } else if (scriptType === types.ScriptType.P2SH_P2WPKH) {
    payment = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh(input),
    });
  } else if (scriptType === types.ScriptType.P2WPKH) {
    payment = bitcoin.payments.p2wpkh(input);
  } else {
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
  }

  console.debug(payment);
  if (!payment.address)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
  if (!payment.output)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
  if (!payment.hash)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
  return { address: payment.address, outScript: payment.output, hash: payment.hash };
}

export function createUnsignedTransactions(
  scriptType: types.ScriptType,
  inputs: Array<types.Input>,
  output: types.Output,
  change: types.Change | undefined,
  version = 1,
  lockTime = 0
): {
  preparedData: types.PreparedData;
  unsignedTransactions: Array<Buffer>;
} {
  const versionBuf = bufferUtil.toUintBuffer(version, 4);
  const lockTimeBuf = bufferUtil.toUintBuffer(lockTime, 4);

  const inputsCount = bufferUtil.toVarUintBuffer(inputs.length);
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

  const hashPrevouts = cryptoUtil.hash256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
  const hashSequence = cryptoUtil.hash256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
  const hashOutputs = cryptoUtil.hash256(outputsBuf);

  const unsignedTransactions = preparedInputs.map(({ pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf }) => {
    if (scriptType === types.ScriptType.P2PKH) {
      const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, scriptType);
      const outScriptLen = bufferUtil.toVarUintBuffer(outScript.length);
      return Buffer.concat([
        versionBuf,
        bufferUtil.toVarUintBuffer(1),
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
        Buffer.from(`1976a914${cryptoUtil.hash160(pubkeyBuf).toString('hex')}88ac`, 'hex'), // ScriptCode
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

export function composeFinalTransaction(
  scriptType: types.ScriptType,
  preparedData: types.PreparedData,
  signatures: Array<Buffer>
): Buffer {
  const { versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

  if (
    scriptType !== types.ScriptType.P2PKH &&
    scriptType !== types.ScriptType.P2WPKH &&
    scriptType !== types.ScriptType.P2SH_P2WPKH
  ) {
    throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType : ${scriptType}`);
  }

  if (scriptType === types.ScriptType.P2PKH) {
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
  } else {
    const flagBuf = Buffer.from('0001', 'hex');
    const segwitBuf = Buffer.concat(
      preparedInputs.map(({ pubkeyBuf }, i) => {
        const signature = signatures[i];
        const segwitScript = Buffer.concat([
          Buffer.from((signature.length + 1).toString(16), 'hex'),
          signature,
          Buffer.from('01', 'hex'),
          Buffer.from(pubkeyBuf.length.toString(16), 'hex'),
          pubkeyBuf,
        ]);
        return Buffer.concat([Buffer.from('02', 'hex'), segwitScript]);
      })
    );

    const inputsBuf = Buffer.concat(
      preparedInputs.map(({ pubkeyBuf, preOutPointBuf, sequenceBuf }) => {
        if (scriptType === types.ScriptType.P2SH_P2WPKH) {
          const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, types.ScriptType.P2WPKH);
          const inScript = Buffer.concat([Buffer.from(outScript.length.toString(16), 'hex'), outScript]);
          return Buffer.concat([preOutPointBuf, bufferUtil.toVarUintBuffer(inScript.length), inScript, sequenceBuf]);
        }
        return Buffer.concat([preOutPointBuf, Buffer.from('00', 'hex'), sequenceBuf]);
      })
    );

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
