import BN from 'bn.js';
import { TransferTxType } from '../config/types';
import TonWeb from 'tonweb';
import { config, utils } from '@coolwallet/core';

/**
  1. Currently, Pro card firmware only supports writing data in Byte, so each bit needs to be written
  as a byte, and the bits must be converted into bytes before signing.

  2. Each toncoin transaction data is composed of one or more Cells, and each Cell contains 1023 bits of data.
*/
export function saveBitAsByte(hex: string): string {
  if (hex.length % 2 !== 0) hex = '0' + hex;

  const buffer = Buffer.from(hex, 'hex');

  let result = '';
  for (let byte of buffer) {
    for (let bit of byte.toString(2).padStart(8, '0')) {
      result += bit === '0' ? '00' : '01';
    }
  }
  return result;
}

// [seqno(4B)] [expireAt(4B)] [sendMode(1B)] [cell2Length(8B)] [isBounceable(1B)] [receiver(256B)] [amountLength(4B)] [amount(120B)] [memo(512B)]
export function getArgument(transaction: Required<TransferTxType>, addressIndex: number): string {
  console.debug(`scriptUtils.getArgument transaction=${JSON.stringify(transaction, null, 2)}`);
  const { seqno, expireAt, receiver, amount, payload, sendMode } = transaction;

  const { isBounceable, hashPart } = new TonWeb.Address(receiver);
  const amountBuffer = new BN(amount).toBuffer();

  const seqnoArg = seqno.toString(16).padStart(8, '0');
  const expireAtArg = expireAt.toString(16).padStart(8, '0');
  const sendModeArg = sendMode.toString(16).padStart(2, '0');
  const isBounceableArg = isBounceable ? '01' : '00';
  const receiverArg = Buffer.from(hashPart).toString('hex');
  const amountLengthArg = amountBuffer.byteLength.toString(16);
  const amountArg = amountBuffer.toString('hex');
  const memoArg = payload ? '00000000' + Buffer.from(new TextEncoder().encode(payload || '')).toString('hex') : '';
  const memoLength = ((memoArg.length / 2) * 8).toString(16).padStart(4, '0');
  const cell2LengthArg = (96 + memoArg.length + amountArg.length).toString(16);

  const argument =
    seqnoArg +
    expireAtArg +
    sendModeArg +
    saveBitAsByte(cell2LengthArg) +
    isBounceableArg +
    saveBitAsByte(receiverArg) +
    saveBitAsByte(amountLengthArg).slice(8, 16) +
    saveBitAsByte(amountArg).padEnd(240, '0') +
    memoLength +
    saveBitAsByte(memoArg).padEnd(1024, '0');

  const pathLength = '0D';
  const path = utils.getFullPath({ pathString: `44'/607'/${addressIndex}'`, pathType: config.PathType.SLIP0010 });
  const SEPath = `${pathLength}${path}`;
  console.debug('SEPath: ', SEPath);
  console.debug('argument: ', argument);
  return SEPath + argument;
}
