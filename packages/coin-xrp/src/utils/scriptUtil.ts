import { utils } from '@coolwallet/core';
import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import * as txUtil from './tracsactionUtil';
import rlp from 'rlp';

type HexInput = string | number;
type PaymentInput = HexInput | undefined;

export const toHexValue = (value: HexInput, byteLength?: number): string => {
  const rawHex = typeof value === 'string' ? stringUtil.removeHex0x(value.trim()) : BigInt(value).toString(16);

  if (rawHex.startsWith('-')) {
    throw new Error(`Negative value is not supported: ${value}`);
  }

  const normalizedHex = stringUtil.handleHex(rawHex);
  if (!byteLength) return normalizedHex;

  const targetLength = byteLength * 2;
  if (normalizedHex.length > targetLength) {
    throw new Error(`Value exceeds ${byteLength} bytes: ${value}`);
  }

  return normalizedHex.padStart(targetLength, '0');
};

export const toRlpBytes = (value: PaymentInput, byteLength?: number): Uint8Array => {
  if (value === undefined) {
    return Uint8Array.from('');
  }
  return Uint8Array.from(Buffer.from(toHexValue(value, byteLength), 'hex'));
};

export const encodeMemoField = (value?: string): Uint8Array => {
  if (value === undefined) {
    return Uint8Array.from('');
  }

  const dataHex = stringUtil.handleHex(stringUtil.removeHex0x(value));
  const dataLengthHex = toHexValue(dataHex.length / 2);
  return Uint8Array.from(Buffer.from(dataLengthHex + dataHex, 'hex'));
};

export const getPaymentArgument = async (
  addressIndex: number,
  payment: types.Payment,
  newScript: boolean
): Promise<string> => {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  if (!payment.Account || !payment.SigningPubKey) {
    throw new Error('Account or SigningPubKey is not set');
  }
  let argument;
  console.log('newScript', newScript);
  if (!newScript) {
    argument =
      stringUtil.handleHex(txUtil.getAccount(payment.Account)) +
      stringUtil.handleHex(payment.SigningPubKey) +
      stringUtil.handleHex(txUtil.getAccount(payment.Destination)) +
      stringUtil.handleHex(parseInt(payment.Amount).toString(16).padStart(16, '0')) +
      stringUtil.handleHex(parseInt(payment.Fee).toString(16).padStart(16, '0')) +
      stringUtil.handleHex(payment.Sequence.toString(16).padStart(8, '0')) +
      stringUtil.handleHex(payment.LastLedgerSequence.toString(16).padStart(8, '0')) +
      stringUtil.handleHex(payment.DestinationTag!.toString(16).padStart(8, '0')) +
      stringUtil.handleHex(payment.Flags!.toString(16).padStart(8, '0'));
  } else {
    const transaction: Array<Uint8Array | Uint8Array[]> = [];
    transaction.push(toRlpBytes(payment.Flags, 4));
    transaction.push(toRlpBytes(payment.Sequence, 4));
    transaction.push(toRlpBytes(payment.DestinationTag, 4));
    transaction.push(toRlpBytes(payment.LastLedgerSequence, 4));
    transaction.push(toRlpBytes(parseInt(payment.Amount), 7));
    transaction.push(toRlpBytes(parseInt(payment.Fee), 7));
    transaction.push(toRlpBytes(payment.SigningPubKey, 33));
    transaction.push(toRlpBytes(txUtil.getAccount(payment.Account), 20));
    transaction.push(toRlpBytes(txUtil.getAccount(payment.Destination), 20));
    const memos: Uint8Array[] = [];
    if (payment.Memos) {
      const memo = payment.Memos[0]?.Memo;
      if (memo) {
        memos.push(encodeMemoField(memo.MemoType));
        memos.push(encodeMemoField(memo.MemoData));
        memos.push(encodeMemoField(memo.MemoFormat));
      }
    }
    transaction.push(memos);
    argument = Buffer.from(rlp.encode(transaction)).toString('hex');
  }
  return SEPath + argument;
};
