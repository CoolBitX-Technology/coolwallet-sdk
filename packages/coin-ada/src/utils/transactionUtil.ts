import { decodeAddress, cborEncode } from './index';
import {
  MajorType,
  Integer,
  Input,
  Output,
  Witness,
  Transfer,
  TransferWithoutFee
} from '../config/types';

export const genInputs = (inputs: Input[]): string => {
  let result = '00' + cborEncode(MajorType.Array, inputs.length);
  for (let { txId, index } of inputs) {
    txId = txId.startsWith('0x') ? txId.substr(2) : txId;
    if (txId.length != 64) throw new Error('txId length is invalid');
    result += '825820' + txId + cborEncode(MajorType.Uint, index);
  }
  return result;
};

export const genOutputs = (output: Output, change?: Output): string => {
  const outputCount = change ? 2 : 1;
  let result = '01' + cborEncode(MajorType.Array, outputCount);
  // output
  result += '82';
  let addressBuff = decodeAddress(output.address).addressBuff;
  result += cborEncode(MajorType.Byte, addressBuff.length);
  result += addressBuff.toString('hex');
  result += cborEncode(MajorType.Uint, output.amount)
  // change
  if (change) {
    result += '82';
    addressBuff = decodeAddress(change.address).addressBuff;
    result += cborEncode(MajorType.Byte, addressBuff.length);
    result += addressBuff.toString('hex');
    result += cborEncode(MajorType.Uint, change.amount)
  }
  return result;
};

export const genFee = (value: Integer): string => {
  let result = '02';
  result += cborEncode(MajorType.Uint, value);
  return result;
};

export const genTtl = (value: Integer): string => {
  let result = '03';
  result += cborEncode(MajorType.Uint, value);
  return result;
};

export const genFakeWitness = (addressIndexes: number[]): string => {
  let result = 'a100' + cborEncode(
    MajorType.Array,
    addressIndexes.length
  );
  for (let index of addressIndexes) {
    result += '825820' + '0'.repeat(64);
    result += '5840' + '0'.repeat(128);
  }
  return result;
};

export const genWitness = (witnesses: Witness[]): string => {
  let result = 'a100' + cborEncode(MajorType.Array, witnesses.length);
  for (let witness of witnesses) {
    const { vkey, sig } = witness;
    if (vkey.length != 64) throw new Error('vkey length is invalid');
    if (sig.length != 128) throw new Error('signature length is invalid');
    result += '825820' + vkey;
    result += '5840' + sig;
  }
  return result;
};

export const genTransferTxBody = (data: Transfer | TransferWithoutFee) => {
  let tx = 'a4';
  tx += genInputs(data.inputs);
  tx += genOutputs(data.output, data.change);
  if (!(data as Transfer).fee) {
    tx += genFee(170000);
  } else {
    tx += genFee((data as Transfer).fee);
  }
  tx += genTtl(data.ttl);
  return tx;
};
