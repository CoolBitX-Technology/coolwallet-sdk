import BN from 'bn.js';
import { error } from '@coolwallet/core';
import * as bitcoin from 'bitcoinjs-lib';
import * as varuint from './varuintUtil';
import * as cryptoUtil from './cryptoUtil';
import { ScriptType, OmniType, Input, Output, Change, PreparedData } from '../config/types';

function toReverseUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray()).reverse();
  return Buffer.alloc(byteSize).fill(buf, 0, buf.length);
}

function toUintBuffer(numberOrString: number | string, byteSize: number): Buffer {
  const bn = new BN(numberOrString);
  const buf = Buffer.from(bn.toArray());
  return Buffer.alloc(byteSize).fill(buf, byteSize - buf.length, byteSize);
}

export function addressToOutScript(address: string): { scriptType: ScriptType; outScript: Buffer; outHash?: Buffer } {
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

export function pubkeyToAddressAndOutScript(
  pubkey: Buffer,
  scriptType: ScriptType
): { address: string; outScript: Buffer; hash: Buffer } {
  let payment;
  switch (scriptType) {
    case ScriptType.P2PKH:
      payment = bitcoin.payments.p2pkh({ pubkey });
      break;
    case ScriptType.P2SH_P2WPKH:
      payment = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey }),
      });
      break;
    case ScriptType.P2WPKH:
      payment = bitcoin.payments.p2wpkh({ pubkey });
      break;
    default:
      throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
  }
  // if (scriptType === ScriptType.P2PKH) {
  //   payment = bitcoin.payments.p2pkh({ pubkey });
  // } else if (scriptType === ScriptType.P2SH_P2WPKH) {
  //   payment = bitcoin.payments.p2sh({
  //     redeem: bitcoin.payments.p2wpkh({ pubkey }),
  //   });
  // } else if (scriptType === ScriptType.P2WPKH) {
  //   payment = bitcoin.payments.p2wpkh({ pubkey });
  // } else {
  //   throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
  // }
  if (!payment.address)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
  if (!payment.output)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
  if (!payment.hash)
    throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
  return { address: payment.address, outScript: payment.output, hash: payment.hash };
}

export function createUnsignedTransactions(
  redeemScriptType: ScriptType,
  inputs: Array<Input>,
  output: Output,
  change?: Change | null,
  value?: string | null,
  omniType?: OmniType | null,
  version = 1,
  lockTime = 0
): {
  preparedData: PreparedData;
  unsignedTransactions: Array<Buffer>;
} {
  const versionBuf = toReverseUintBuffer(version, 4);
  const lockTimeBuf = toReverseUintBuffer(lockTime, 4);
  const inputsCount = varuint.encode(inputs.length);
  const preparedInputs = inputs.map(({ preTxHash, preIndex, preValue, sequence, addressIndex, pubkeyBuf }) => {
    if (!pubkeyBuf) {
      throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
    }
    const preOutPointBuf = Buffer.concat([Buffer.from(preTxHash, 'hex').reverse(), toReverseUintBuffer(preIndex, 4)]);

    const preValueBuf = toReverseUintBuffer(preValue, 8);
    const sequenceBuf = sequence ? toReverseUintBuffer(sequence, 4) : Buffer.from('ffffffff', 'hex');

    return {
      addressIndex,
      pubkeyBuf,
      preOutPointBuf,
      preValueBuf,
      sequenceBuf,
    };
  });

  const { scriptType: outputType, outScript: outputScript } = addressToOutScript(output.address);
  const outputScriptLen = varuint.encode(outputScript.length);

  let outputArray;
  if (!omniType) {
    outputArray = [Buffer.concat([toReverseUintBuffer(output.value, 8), outputScriptLen, outputScript])];
  } else {
    const omni = Buffer.concat([
      Buffer.from('omni', 'ascii'),
      toUintBuffer(0, 2), // Transaction version
      toUintBuffer(0, 2), // Transaction type
      toUintBuffer(omniType, 4), // Currency identifier
      toUintBuffer(value as string, 8),
    ]);
    const omniLen = varuint.encode(omni.length);
    const omniScript = Buffer.concat([
      Buffer.from('6a', 'hex'), // OP_RETURN
      omniLen,
      omni,
    ]);
    const omniScriptLen = varuint.encode(omniScript.length);
    outputArray = [
      Buffer.concat([
        toReverseUintBuffer(546, 8),
        outputScriptLen,
        outputScript,
        toUintBuffer(0, 8),
        omniScriptLen,
        omniScript,
      ]),
    ];
  }
  if (change) {
    if (!change.pubkeyBuf) throw new error.SDKError(createUnsignedTransactions.name, 'Public Key not exists !!');
    const changeValue = toReverseUintBuffer(change.value, 8);
    const { outScript } = pubkeyToAddressAndOutScript(change.pubkeyBuf, redeemScriptType);
    const outScriptLen = varuint.encode(outScript.length);
    outputArray.push(Buffer.concat([changeValue, outScriptLen, outScript]));
  }

  let outputsCountNum = omniType ? 2 : 1;
  outputsCountNum = change ? outputsCountNum + 1 : outputsCountNum;
  const outputsCount = varuint.encode(outputsCountNum);
  const outputsBuf = Buffer.concat(outputArray);

  const hashPrevouts = cryptoUtil.doubleSha256(Buffer.concat(preparedInputs.map((input) => input.preOutPointBuf)));
  const hashSequence = cryptoUtil.doubleSha256(Buffer.concat(preparedInputs.map((input) => input.sequenceBuf)));
  const hashOutputs = cryptoUtil.doubleSha256(outputsBuf);

  const unsignedTransactions = preparedInputs.map(({ pubkeyBuf, preOutPointBuf, preValueBuf, sequenceBuf }) => {
    if (redeemScriptType === ScriptType.P2PKH) {
      const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, redeemScriptType);
      const outScriptLen = varuint.encode(outScript.length);
      return Buffer.concat([
        versionBuf,
        varuint.encode(1),
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
  redeemScriptType: ScriptType,
  preparedData: PreparedData,
  signatures: Array<Buffer>
): Buffer {
  const { versionBuf, inputsCount, preparedInputs, outputsCount, outputsBuf, lockTimeBuf } = preparedData;

  if (
    redeemScriptType !== ScriptType.P2PKH &&
    redeemScriptType !== ScriptType.P2WPKH &&
    redeemScriptType !== ScriptType.P2SH_P2WPKH
  ) {
    throw new error.SDKError(composeFinalTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
  }

  if (redeemScriptType === ScriptType.P2PKH) {
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
        return Buffer.concat([preOutPointBuf, varuint.encode(inScript.length), inScript, sequenceBuf]);
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
        if (redeemScriptType === ScriptType.P2SH_P2WPKH) {
          const { outScript } = pubkeyToAddressAndOutScript(pubkeyBuf, ScriptType.P2WPKH);
          const inScript = Buffer.concat([Buffer.from(outScript.length.toString(16), 'hex'), outScript]);
          return Buffer.concat([preOutPointBuf, varuint.encode(inScript.length), inScript, sequenceBuf]);
        } else {
          return Buffer.concat([preOutPointBuf, Buffer.from('00', 'hex'), sequenceBuf]);
        }
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
