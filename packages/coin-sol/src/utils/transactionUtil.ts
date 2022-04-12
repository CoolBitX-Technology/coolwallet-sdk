import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';

import base58 from 'bs58';
import Message from './Message';
const BN = require('bn.js');

// export class TransferTx {
//   sigCount: string;
//   signature: string;
//   numberRequireSignature: string;
//   numberReadonlySignedAccount: string;
//   numberReadonlyUnSignedAccount: string;
//   keyCount: string;
//   keys: string[];
//   recentBlockHash: string;
//   instructionCount: string;
//   programIdIndex: string;
//   keyIndicesCount: string;
//   keyIndices: string;
//   dataLength: string;
//   data: string;

//   constructor(rawTx: {
//     signature?: string;
//     numberRequireSignature: string;
//     numberReadonlySignedAccount: string;
//     numberReadonlyUnSignedAccount: string;
//     keyCount: string;
//     keys: string[];
//     recentBlockHash: string;
//     instructionCount: string;
//     programIdIndex: string;
//     keyIndicesCount: string;
//     keyIndices: string;
//     dataLength: string;
//     data: string;
//   }) {
//     this.sigCount = '01';
//     this.signature = rawTx.signature || '';
//     this.numberRequireSignature = rawTx.numberRequireSignature;
//     this.numberReadonlySignedAccount = rawTx.numberReadonlySignedAccount;
//     this.numberReadonlyUnSignedAccount = rawTx.numberReadonlyUnSignedAccount;
//     this.keyCount = rawTx.keyCount;
//     this.keys = rawTx.keys;
//     this.recentBlockHash = rawTx.recentBlockHash;
//     this.instructionCount = rawTx.instructionCount;
//     this.programIdIndex = rawTx.programIdIndex;
//     this.keyIndicesCount = rawTx.keyIndicesCount;
//     this.keyIndices = rawTx.keyIndices;
//     this.dataLength = rawTx.dataLength;
//     this.data = rawTx.data;
//   }

//   transferDataEncode(amount: number | string): string {
//     const data = Buffer.alloc(12);
//     const programIdIndexSpan = 4;
//     data.writeUIntLE(2, 0, programIdIndexSpan);
//     const v2e32 = Math.pow(2, 32);
//     const value = Number(amount) * params.LAMPORTS_PER_SOL;
//     const hi32 = Math.floor(value / v2e32);
//     const lo32 = value - hi32 * v2e32;
//     data.writeUInt32LE(lo32, programIdIndexSpan);
//     data.writeInt32LE(hi32, programIdIndexSpan + 4);
//     this.data = data.toString('hex');
//     return data.toString('hex');
//   }

//   splDataEncode(amount: number | string, decimals: number = 9): string {
//     const data = Buffer.alloc(9);
//     const programIdIndexSpan = 1;
//     data.writeUIntLE(3, 0, programIdIndexSpan);
//     const [round, decimal] = amount.toString().split('.');

//     let value = Number(round) > 0 ? round : '';
//     if (decimal) {
//       value += decimal.charAt(decimals) ? decimal.split('').slice(0, decimals).join('') : decimal.padEnd(decimals, '0');
//     } else {
//       value = value + ''.padEnd(decimals, '0');
//     }
//     const valueHex = new BN(value).toString(16, 8 * 2);
//     const valueBuf = Buffer.from(valueHex, 'hex').reverse();

//     data.write(valueBuf.toString('hex'), programIdIndexSpan, 8, 'hex');
//     this.data = data.toString('hex');
//     return decimals.toString(16) + data.toString('hex');
//   }

//   serialize(signature: string): string {
//     this.signature = signature;
//     const keysLength = this.keys.length;
//     return (
//       this.sigCount +
//       this.signature +
//       this.numberRequireSignature +
//       this.numberReadonlySignedAccount +
//       this.numberReadonlyUnSignedAccount +
//       this.keyCount +
//       this.keys
//         .map((key, index) => {
//           if (key === ''.padStart(64, '0') && index !== keysLength - 1) {
//             return '';
//           }
//           return key;
//         })
//         .join('') +
//       this.recentBlockHash +
//       this.instructionCount +
//       this.programIdIndex +
//       this.keyIndicesCount +
//       this.keyIndices +
//       this.dataLength +
//       this.data
//     );
//   }
//   serializeArgument(): string {
//     return this.keyCount + this.keys.join('') + this.recentBlockHash + this.dataLength + this.data;
//   }
// }
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
    return '01' + this.signature + this.serializeArgument(false);
  }
  serializeArgument(isPartialSerialize = true): string {
    return this.complieMessage(isPartialSerialize).serialize(isPartialSerialize);
  }

  complieMessage(isPartialCompile = false): Message {
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
    accountMetas.sort((x, y) => {
      const xBs58 = base58.encode(Buffer.from(x.pubkey as string, 'hex'));
      const yBs58 = base58.encode(Buffer.from(y.pubkey as string, 'hex'));
      const pubkeySorting = xBs58.localeCompare(yBs58);
      const checkSigner = x.isSigner === y.isSigner ? 0 : x.isSigner ? -1 : 1;
      const checkWritable = x.isWritable === y.isWritable ? pubkeySorting : x.isWritable ? -1 : 1;
      return checkSigner || checkWritable;
    });

    let numUnRequiredAccounts = 0;
    // Cull duplicate account metas
    const uniqueMetas: types.AccountMeta[] = [];
    accountMetas.forEach((accountMeta) => {
      const uniqueIndex = uniqueMetas.findIndex((e) => {
        return e.pubkey === (accountMeta.pubkey as string);
      });
      if (uniqueIndex > -1) {
        if (isPartialCompile) {
          uniqueMetas.push({ ...accountMeta, pubkey: '' });
          numUnRequiredAccounts += 1;
        } else uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
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
      } else if (isPartialCompile) {
        const pubkeyStr = pubkey.toString();
        unsignedKeys.push(pubkeyStr.length < 1 ? ''.padStart(64, '0') : pubkeyStr);
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
        numUnRequiredAccounts,
      },
      accountKeys,
      recentBlockhash: this.recentBlockhash,
      instructions,
    });
  }
}
