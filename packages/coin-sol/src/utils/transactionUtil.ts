import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';

import base58 from 'bs58';
import Message from './messageUtil';
const BN = require('bn.js');

export class TransferTx {
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

  transferDataEncode(amount: number | string, decimals: number = 9): string {
    const data = Buffer.alloc(12);
    const programIdIndexSpan = 4;
    data.writeUIntLE(2, 0, programIdIndexSpan);
    const v2e32 = Math.pow(2, 32);
    const value = Number(amount) * params.LAMPORTS_PER_SOL;
    const hi32 = Math.floor(value / v2e32);
    const lo32 = value - hi32 * v2e32;
    data.writeUInt32LE(lo32, programIdIndexSpan);
    data.writeInt32LE(hi32, programIdIndexSpan + 4);
    this.data = data.toString('hex');
    return data.toString('hex');
  }

  splDataEncode(amount: number | string, decimals: number = 9): string {
    const data = Buffer.alloc(9);
    const programIdIndexSpan = 1;
    data.writeUIntLE(3, 0, programIdIndexSpan);
    const [round, decimal] = amount.toString().split('.');

    let value = Number(round) > 0 ? round : '';
    if (decimal) {
      value += decimal.charAt(decimals) ? decimal.split('').slice(0, decimals).join('') : decimal.padEnd(decimals, '0');
    } else {
      value = value + ''.padEnd(decimals, '0');
    }
    const valueHex = new BN(value).toString(16, 8 * 2);
    const valueBuf = Buffer.from(valueHex, 'hex').reverse();

    data.write(valueBuf.toString('hex'), programIdIndexSpan, 8, 'hex');
    this.data = data.toString('hex');
    return data.toString('hex');
  }

  serialize(signature: string): string {
    this.signature = signature;
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

export function formTransferTx(transaction: types.TransferTransaction, signature?: string): TransferTx {
  const { fromPubkey, toPubkey, recentBlockhash, amount, options } = transaction;

  const fromAddress = stringUtil.formHex(fromPubkey);
  const isTransferSelf = fromAddress === stringUtil.formHex(toPubkey);
  const toAddress = isTransferSelf ? ''.padStart(64, '0') : stringUtil.formHex(toPubkey);

  const keys = [fromAddress, toAddress, stringUtil.formHex(params.SYSTEM_PROGRAM_ID)];

  const recentBH = base58.decode(recentBlockhash).toString('hex');

  const rawTx = new TransferTx({
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

  if (options) {
    rawTx.keys = [
      stringUtil.formHex(options.owner),
      toAddress,
      fromAddress,
      stringUtil.formHex(params.TOKEN_PROGRAM_ID),
    ];
    if (isTransferSelf) {
      rawTx.keyCount = '03';
      rawTx.programIdIndex = '02';
      rawTx.keyIndicesCount = '03';
      rawTx.keyIndices = '010100';
    } else {
      rawTx.keyCount = '04';
      rawTx.programIdIndex = '03';
      rawTx.keyIndicesCount = '03';
      rawTx.keyIndices = '020100';
    }
    rawTx.splDataEncode(amount as string | number, Number(options.decimals || 9));
  } else {
    if (isTransferSelf) {
      rawTx.keyCount = '02';
      rawTx.programIdIndex = '01';
      rawTx.keyIndicesCount = '02';
      rawTx.keyIndices = '0000';
    }
    rawTx.transferDataEncode(amount as string | number);
  }

  let dataCount: number[] = [];
  stringUtil.encodeLength(dataCount, rawTx.data.length / 2);

  rawTx.dataLength = stringUtil.numberToStringHex(dataCount, 2);

  return rawTx;
}

export class Transaction {
  feePayer: string | Buffer;
  recentBlockhash: string;
  instructions: types.TransactionInstruction[];
  signature?: string;
  constructor(tx: types.TransactionArgs) {
    this.feePayer = stringUtil.formHex(tx.feePayer);
    this.recentBlockhash = stringUtil.formHex(tx.recentBlockhash);
    this.instructions = tx.instructions.map((instruction) => ({
      ...instruction,
      programId: stringUtil.formHex(instruction.programId),
      accounts: instruction.accounts.map((account) => ({
        ...account,
        pubkey: stringUtil.formHex(account.pubkey),
      })),
    }));
  }
  serialize(signature: string): string {
    this.signature = signature;
    return '01' + this.signature + this.serializeArgument();
  }
  serializeArgument(): string {
    return this.complieMessage().serialize();
  }

  complieMessage(): Message {
    const { recentBlockhash, feePayer } = this;
    if (!recentBlockhash) {
      throw new Error('Transaction recentBlockhash required');
    }

    if (this.instructions.length < 1) {
      console.warn('No instructions provided');
    }

    if (!feePayer || feePayer.length < 1) {
      throw new Error('Transaction fee payer required');
    }

    const programIds: string[] = [];
    const accountMetas: types.AccountMeta[] = [];
    this.instructions.forEach((instruction) => {
      instruction.accounts.forEach((accountMeta) => {
        accountMetas.push(accountMeta);
      });
      let programId = stringUtil.formHex(instruction.programId);

      if (!programIds.includes(programId)) {
        programIds.push(programId);
      }
    });

    // Append programID account metas
    programIds.forEach((programId) => {
      accountMetas.push({
        pubkey: programId,
        isSigner: false,
        isWritable: false,
      });
    });

    // Sort. Prioritizing first by signer, then by writable
    accountMetas.sort((cur, next) => {
      const pubkeySorting = (cur.pubkey as string) === (next.pubkey as string) ? 1 : 0;
      const checkSigner = cur.isSigner === next.isSigner ? 0 : cur.isSigner ? -1 : 1;
      const checkWritable = cur.isWritable === next.isWritable ? pubkeySorting : cur.isWritable ? -1 : 1;
      return checkSigner || checkWritable;
    });

    // Cull duplicate account metas
    const uniqueMetas: types.AccountMeta[] = [];
    accountMetas.forEach((accountMeta) => {
      const uniqueIndex = uniqueMetas.findIndex((e) => {
        return e.pubkey === (accountMeta.pubkey as string);
      });
      if (uniqueIndex > -1) {
        uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
      } else {
        uniqueMetas.push(accountMeta);
      }
    });

    // Move fee payer to the front
    const feePayerIndex = uniqueMetas.findIndex((e) => {
      return e.pubkey === feePayer;
    });
    if (feePayerIndex > -1) {
      const [payerMeta] = uniqueMetas.splice(feePayerIndex, 1);
      payerMeta.isSigner = true;
      payerMeta.isWritable = true;
      uniqueMetas.unshift(payerMeta);
    } else {
      uniqueMetas.unshift({
        pubkey: feePayer,
        isSigner: true,
        isWritable: true,
      });
    }

    // transaction header data
    let numRequiredSignatures = 0;
    let numReadonlySignedAccounts = 0;
    let numReadonlyUnsignedAccounts = 0;

    // Split out signing from non-signing keys and count header values
    const signedKeys: string[] = [];
    const unsignedKeys: string[] = [];
    uniqueMetas.forEach(({ pubkey, isSigner, isWritable }) => {
      if (isSigner) {
        signedKeys.push(pubkey.toString());
        numRequiredSignatures += 1;
        if (!isWritable) {
          numReadonlySignedAccounts += 1;
        }
      } else {
        unsignedKeys.push(pubkey.toString());
        if (!isWritable) {
          numReadonlyUnsignedAccounts += 1;
        }
      }
    });

    const accountKeys = signedKeys.concat(unsignedKeys);
    const instructions: types.CompliedInstruction[] = this.instructions.map((instruction) => {
      const { data, programId } = instruction;
      return {
        programIdIndex: accountKeys.indexOf(programId as string),
        accounts: instruction.accounts.map((meta) => accountKeys.indexOf(meta.pubkey as string)),
        data: stringUtil.formHex(data),
      };
    });

    instructions.forEach((instruction) => {
      if (instruction.programIdIndex < 0) throw new Error('Assertion failed');

      instruction.accounts.forEach((keyIndex) => {
        if (keyIndex < 0) throw new Error('Assertion failed');
      });
    });
    return new Message({
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts,
      },
      accountKeys,
      recentBlockhash: this.recentBlockhash,
      instructions,
    });
  }
}
