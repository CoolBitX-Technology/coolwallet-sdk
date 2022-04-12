import * as types from '../config/types';
import * as stringUtil from './stringUtil';

import base58 from 'bs58';
import Message from './Message';
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
