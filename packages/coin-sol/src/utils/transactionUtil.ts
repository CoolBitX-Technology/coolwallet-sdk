import * as params from '../config/params';
import { TransactionType } from '../config/types';
import { addressToHex, encodeLength, getTxType, isBase58Format, numberToStringHex } from './stringUtil';

import base58 from 'bs58';

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
  keys: string;
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
    keys: string;
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

  dataEncode(amount: number | string, decimals?: number | undefined): string {
    const programIdToNumber = Number(this.programIdIndex);
    const isNormalTransfer = programIdToNumber === 2;
    const dataAlloc = isNormalTransfer ? 12 : 9;
    const data = Buffer.alloc(dataAlloc);

    const v2e32 = Math.pow(2, 32);

    const value = Number(amount) * (decimals ? Math.pow(10, decimals) : params.LAMPORTS_PER_SOL);

    const hi32 = Math.floor(value / v2e32);
    const lo32 = value - hi32 * v2e32;

    const programIdIndexSpan = isNormalTransfer ? 4 : 1;

    data.writeUIntLE(programIdToNumber, 0, programIdIndexSpan);
    data.writeUInt32LE(lo32, programIdIndexSpan);
    data.writeInt32LE(hi32, programIdIndexSpan + 4);
    this.data = data.toString('hex');
    return data.toString('hex');
  }

  serialize() {
    return (
      this.sigCount +
      this.signature +
      this.numberRequireSignature +
      this.numberReadonlySignedAccount +
      this.numberReadonlyUnSignedAccount +
      this.keyCount +
      this.keys +
      this.recentBlockHash +
      this.instructionCount +
      this.programIdIndex +
      this.keyIndicesCount +
      this.keyIndices +
      this.dataLength +
      this.data
    );
  }
  serializeArgument() {
    return this.keys + this.recentBlockHash + this.dataLength + this.data;
  }
}

export function formTransaction(transaction: TransactionType, signature?: string): RawTransaction {
  const { fromPubkey, toPubkey, recentBlockhash, amount, options } = transaction;
  const { programId, data, owner, decimals, value } = options;

  let txType = getTxType(transaction);

  const keys = addressToHex(owner) + addressToHex(fromPubkey) + addressToHex(toPubkey) + addressToHex(programId);
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
    case params.TX_TYPE.SMART_CONTRACT:
      rawTx.data =
        typeof data === 'string'
          ? isBase58Format(data)
            ? base58.decode(data).toString('hex')
            : data
          : (data as Buffer).toString('hex');
      rawTx.data = rawTx.data.length === 0 ? '00' : evenHexDigit(rawTx.data);
      rawTx.keyIndicesCount = '01';
      rawTx.keyIndices = '01';
      break;
    case params.TX_TYPE.SPL_TOKEN:
      rawTx.programIdIndex = '03';
      rawTx.dataEncode(value as string | number, decimals);
      break;
    default:
      rawTx.dataEncode(amount as string | number);
      break;
  }

  let dataCount: number[] = [];
  encodeLength(dataCount, rawTx.data.length / 2);

  rawTx.dataLength = numberToStringHex(dataCount, 2);

  return rawTx;
}
