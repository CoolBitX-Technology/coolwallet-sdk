import * as params from '../config/params';
import { TransactionOptions, TransactionType } from '../config/types';
import { addressToHex, encodeLength, isBase58Format, numberToStringHex } from './stringUtil';

import base58 from 'bs58';
const BN = require('bn.js');

const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export function pubKeyToAddress(publicKey: string): string {
  const pubKeyBuf = Buffer.from(publicKey, 'hex');
  return base58.encode(pubKeyBuf);
}

export class RawTransaction {
  sigCount: string;
  signature: string;
  numberRequireSignature: string;
  numberReadonlySignedAccount: string;
  numberReadonlyUnSignedAccount: string;
  keyCount: string;
  keys: string[];
  recentBlockHash: string;
  instructionCount: string;
  programIdIndex: string;
  keyIndicesCount: string;
  keyIndices: string;
  dataLength: string;
  data: string;

  constructor(rawTx: {
    signature?: string;
    numberRequireSignature: string;
    numberReadonlySignedAccount: string;
    numberReadonlyUnSignedAccount: string;
    keyCount: string;
    keys: string[];
    recentBlockHash: string;
    instructionCount: string;
    programIdIndex: string;
    keyIndicesCount: string;
    keyIndices: string;
    dataLength: string;
    data: string;
  }) {
    this.sigCount = '01';
    this.signature = rawTx.signature || '';
    this.numberRequireSignature = rawTx.numberRequireSignature;
    this.numberReadonlySignedAccount = rawTx.numberReadonlySignedAccount;
    this.numberReadonlyUnSignedAccount = rawTx.numberReadonlyUnSignedAccount;
    this.keyCount = rawTx.keyCount;
    this.keys = rawTx.keys;
    this.recentBlockHash = rawTx.recentBlockHash;
    this.instructionCount = rawTx.instructionCount;
    this.programIdIndex = rawTx.programIdIndex;
    this.keyIndicesCount = rawTx.keyIndicesCount;
    this.keyIndices = rawTx.keyIndices;
    this.dataLength = rawTx.dataLength;
    this.data = rawTx.data;
  }

  dataEncode(amount: number | string, decimals: number = 9): string {
    const programIdToNumber = Number(this.programIdIndex);
    const isSplTransfer = programIdToNumber === 3;
    const programIdIndexSpan = isSplTransfer ? 1 : 4;
    const dataAlloc = isSplTransfer ? 9 : 12;
    const data = Buffer.alloc(dataAlloc);

    data.writeUIntLE(programIdToNumber, 0, programIdIndexSpan);
    if (isSplTransfer) {
      const [round, decimal] = amount.toString().split('.');
      let value = Number(round) > 0 ? round : '';
      if (decimal) {
        value += decimal.charAt(decimals)
          ? decimal.split('').slice(0, decimals).join('')
          : decimal.padEnd(decimals, '0');
      } else {
        value = value + ''.padEnd(decimals, '0');
      }

      const valueHex = new BN(value).toString(16, 8 * 2);
      const valueBuf = Buffer.from(valueHex, 'hex').reverse();

      data.write(valueBuf.toString('hex'), programIdIndexSpan, 8, 'hex');
    } else {
      const v2e32 = Math.pow(2, 32);
      const value = Number(amount) * params.LAMPORTS_PER_SOL;
      const hi32 = Math.floor(value / v2e32);
      const lo32 = value - hi32 * v2e32;

      data.writeUInt32LE(lo32, programIdIndexSpan);
      data.writeInt32LE(hi32, programIdIndexSpan + 4);
    }
    this.data = data.toString('hex');
    return data.toString('hex');
  }

  serialize(): string {
    const keysLength = this.keys.length;
    return (
      this.sigCount +
      this.signature +
      this.numberRequireSignature +
      this.numberReadonlySignedAccount +
      this.numberReadonlyUnSignedAccount +
      this.keyCount +
      this.keys
        .map((key, index) => {
          if (key === ''.padStart(64, '0') && index !== keysLength - 1) {
            return '';
          }
          return key;
        })
        .join('') +
      this.recentBlockHash +
      this.instructionCount +
      this.programIdIndex +
      this.keyIndicesCount +
      this.keyIndices +
      this.dataLength +
      this.data
    );
  }
  serializeArgument(): string {
    return this.keyCount + this.keys.join('') + this.recentBlockHash + this.dataLength + this.data;
  }
}

export function formTransaction(transaction: TransactionType, txType: string, signature?: string): RawTransaction {
  const { fromPubkey, toPubkey, recentBlockhash, amount, options } = transaction;
  const { programId, data, owner, decimals, value } = options as TransactionOptions;

  const fromAddress = addressToHex(fromPubkey);
  const toAddress = fromAddress === addressToHex(toPubkey) ? ''.padStart(64, '0') : addressToHex(toPubkey);

  const keys = [addressToHex(owner), fromAddress, toAddress, addressToHex(programId)];

  const recentBH = base58.decode(recentBlockhash).toString('hex');

  const rawTx = new RawTransaction({
    signature,
    numberRequireSignature: '01',
    numberReadonlySignedAccount: '00',
    numberReadonlyUnSignedAccount: '01',
    keyCount: '03',
    keys,
    recentBlockHash: recentBH,
    instructionCount: '01',
    programIdIndex: '02',
    keyIndicesCount: '02',
    keyIndices: '0001',
    dataLength: '',
    data: '',
  });

  switch (txType) {
    case params.TRANSACTION_TYPE.SMART_CONTRACT:
      if (typeof data === 'string') {
        rawTx.data = isBase58Format(data) ? base58.decode(data).toString('hex') : data;
      } else rawTx.data = (data as Buffer).toString('hex');
      rawTx.data = rawTx.data.length === 0 ? '00' : evenHexDigit(rawTx.data);
      rawTx.keyIndicesCount = '01';
      rawTx.keyIndices = '01';
      break;
    case params.TRANSACTION_TYPE.SPL_TOKEN:
      rawTx.keys = [addressToHex(owner), toAddress, fromAddress, addressToHex(programId)];
      rawTx.keyCount = '04';
      rawTx.programIdIndex = '03';
      rawTx.keyIndicesCount = '03';
      rawTx.keyIndices = '020100';
      rawTx.dataEncode(value as string | number, Number(decimals));
      break;

    default:
      if (addressToHex(transaction.fromPubkey) === addressToHex(transaction.toPubkey)) {
        rawTx.keyCount = '02';
        rawTx.programIdIndex = '01';
        rawTx.keyIndicesCount = '02';
        rawTx.keyIndices = '0000';
      }
      rawTx.dataEncode(amount as string | number);
      break;
  }

  let dataCount: number[] = [];
  encodeLength(dataCount, rawTx.data.length / 2);

  rawTx.dataLength = numberToStringHex(dataCount, 2);

  return rawTx;
}
