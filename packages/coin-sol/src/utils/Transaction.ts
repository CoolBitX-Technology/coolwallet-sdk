import { SDKError } from '@coolwallet/core/lib/error';
import * as stringUtil from './stringUtil';
import Message from './Message';
import * as types from '../config/types';

export default class Transaction {
  feePayer: string;
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

  add(instruction: types.TransactionInstruction) {
    this.instructions.push(instruction);
  }

  /**
   * Compile transaction data
   */
  compileMessage(): Message {
    const { recentBlockhash } = this;
    if (!recentBlockhash) {
      throw new SDKError(this.compileMessage.name, 'Transaction recentBlockhash required');
    }

    if (this.instructions.length < 1) {
      console.warn('No instructions provided');
    }

    let feePayer: string;
    if (this.feePayer) {
      feePayer = this.feePayer;
    } else {
      throw new Error('Transaction fee payer required');
    }

    for (let i = 0; i < this.instructions.length; i++) {
      if (this.instructions[i].programId === undefined) {
        throw new Error(`Transaction instruction index ${i} has undefined program id`);
      }
    }

    const programIds: string[] = [];
    const accountMetas: types.AccountMeta[] = [];
    this.instructions.forEach((instruction) => {
      instruction.accounts.forEach((accountMeta) => {
        accountMetas.push({ ...accountMeta });
      });

      const programId = instruction.programId.toString();
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
    accountMetas.sort(function (x, y) {
      const pubkeySorting = stringUtil.toBase58(x.pubkey).localeCompare(stringUtil.toBase58(y.pubkey));
      const checkSigner = x.isSigner === y.isSigner ? 0 : x.isSigner ? -1 : 1;
      const checkWritable = x.isWritable === y.isWritable ? pubkeySorting : x.isWritable ? -1 : 1;
      return checkSigner || checkWritable;
    });

    // Cull duplicate account metas
    const uniqueMetas: types.AccountMeta[] = [];
    accountMetas.forEach((accountMeta) => {
      const uniqueIndex = uniqueMetas.findIndex((x) => {
        return x.pubkey === accountMeta.pubkey;
      });
      if (uniqueIndex > -1) {
        uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
      } else {
        uniqueMetas.push(accountMeta);
      }
    });

    // Move fee payer to the front
    const feePayerIndex = uniqueMetas.findIndex((x) => {
      return stringUtil.toPublicKey(x.pubkey) === feePayer;
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
        programIdIndex: accountKeys.indexOf(programId.toString()),
        accounts: instruction.accounts.map((meta) => accountKeys.indexOf(meta.pubkey.toString())),
        data: stringUtil.formHex(data),
      };
    });

    return new Message({
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts,
      },
      accountKeys,
      recentBlockhash,
      instructions,
    });
  }

  /**
   * Return sendable tx string with given signature.
   *
   * @param signature signature generated by CoolWallet Pro
   * @returns
   */
  toTxString(signature: string): string {
    this.signature = signature;
    return '01' + this.signature + this.compileMessage().serialize();
  }
}
