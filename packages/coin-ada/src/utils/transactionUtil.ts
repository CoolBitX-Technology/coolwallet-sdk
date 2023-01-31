import { derivePubKeyFromAccountToIndex, blake2b224, decodeAddress, cborEncode } from './index';
import { MajorType, Integer, Input, Output, Witness, TxTypes, Transaction } from '../config/types';

export const genInputs = (inputs: Input[]): string => {
  let result = '00' + cborEncode(MajorType.Array, inputs.length);
  for (const input of inputs) {
    const txId = input.txId.startsWith('0x') ? input.txId.substr(2) : input.txId;
    if (txId.length !== 64) throw new Error('txId length is invalid');
    result += '825820' + txId + cborEncode(MajorType.Uint, input.index);
  }
  return result;
};

const genOutputsPrefix = (output?: Output, change?: Output) => {
  let outputCount = 0;
  if (output) outputCount += 1;
  if (change) outputCount += 1;
  return '01' + cborEncode(MajorType.Array, outputCount);
};

export const genOutput = (output?: Output, isTestNet = false): string => {
  if (!output) return '';
  let result = '82';
  const addressBuff = decodeAddress(output.address, isTestNet).addressBuff;
  result += cborEncode(MajorType.Byte, addressBuff.length);
  result += addressBuff.toString('hex');
  result += cborEncode(MajorType.Uint, output.amount)
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

export const genFakeWitness = (addressIndexes: number[], txType: TxTypes): string => {
  const count = addressIndexes.length + (txType === TxTypes.Transfer ? 0 : 1);
  let result = 'a100' + cborEncode(MajorType.Array, count);
  // for (const index of addressIndexes) {
  //   result += '825820' + '0'.repeat(64);
  //   result += '5840' + '0'.repeat(128);
  // }
  result += '0'.repeat(202*count);
  return result;
};

export const genWitness = (witnesses: Witness[]): string => {
  let result = 'a100' + cborEncode(MajorType.Array, witnesses.length);
  for (const witness of witnesses) {
    const { vkey, sig } = witness;
    if (vkey.length !== 64) throw new Error('vkey length is invalid');
    if (sig.length !== 128) throw new Error('signature length is invalid');
    result += '825820' + vkey;
    result += '5840' + sig;
  }
  return result;
};

const genTxBodyPrefix = (txType: TxTypes) => {
  if (txType === TxTypes.Transfer) return 'a4';
  return 'a5';
};

export const genFakeTxBody = (tx: Transaction, txType: TxTypes, isTestNet = false) => {
  let result = genTxBodyPrefix(txType);
  result += genInputs(tx.inputs);
  result += genOutputsPrefix(tx.output, tx.change);
  result += genOutput(tx.output, isTestNet);
  result += genOutput(tx.change, isTestNet);
  result += genFee(tx.fee);
  result += genTtl(tx.ttl);

  if (txType === TxTypes.StakeRegister) result += '0'.repeat(72);
  if (txType === TxTypes.StakeRegisterAndDelegate) result += '0'.repeat(200);
  if (txType === TxTypes.StakeDeregister) result += '0'.repeat(72);
  if (txType === TxTypes.StakeDelegate) result += '0'.repeat(132);
  if (txType === TxTypes.StakeWithdraw) {
    if (!tx.withdrawAmount) throw new Error('withdrawAmount is required');
    result += '0'.repeat(66) + cborEncode(MajorType.Uint, tx.withdrawAmount);
  }

  return result;
};

export const genTxBody = (tx: Transaction, accPubKey: string, txType: TxTypes, isTestNet = false) => {
  let result = genTxBodyPrefix(txType);
  result += genInputs(tx.inputs);
  result += genOutputsPrefix(tx.output, tx.change);
  result += genOutput(tx.output, isTestNet);
  result += genOutput(tx.change, isTestNet);
  result += genFee(tx.fee);
  result += genTtl(tx.ttl);

  if (txType === TxTypes.Transfer) return result;

  const accPubKeyBuff = Buffer.from(accPubKey, 'hex');
  const stakeKeyBuff = derivePubKeyFromAccountToIndex(accPubKeyBuff, 2, 0);
  const stakeKeyHash = blake2b224(stakeKeyBuff).toString('hex').padStart(56, '0');

  if (txType === TxTypes.StakeRegister) result += '048182008200581c' + stakeKeyHash;
  if (txType === TxTypes.StakeDeregister) result += '048182018200581c' + stakeKeyHash;
  if (txType === TxTypes.StakeDelegate) {
    if (!tx.poolKeyHash) throw new Error('poolKeyHash is required');
    result += '048183028200581c' + stakeKeyHash + '581c' + tx.poolKeyHash;
  }
  if (txType === TxTypes.StakeWithdraw) {
    if (!tx.withdrawAmount) throw new Error('withdrawAmount is required');
    result += '05a1581de1' + stakeKeyHash + cborEncode(MajorType.Uint, tx.withdrawAmount);
  }
  if (txType === TxTypes.StakeRegisterAndDelegate) {
    if (!tx.poolKeyHash) throw new Error('poolKeyHash is required');
    result += '048282008200581c' + stakeKeyHash;
    result += '83028200581c' + stakeKeyHash + '581c' + tx.poolKeyHash;
  }
  return result;
};
