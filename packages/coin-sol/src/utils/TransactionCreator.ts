import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import { encodeData, SystemProgramLayout } from './layoutUtil';
import { Transaction } from './transactionUtil';

export default class TransactionCreator {
  constructor() {}

  static transfer(
    fromPubkey: types.Address,
    toPubkey: types.Address,
    recentBlockhash: string,
    amount: number | string
  ): types.TransactionArgs {
    const data = encodeData(SystemProgramLayout.Transfer, {
      lamports: Number(amount) * params.LAMPORTS_PER_SOL,
    });
    return {
      txType: params.TRANSACTION_TYPE.TRANSFER,
      instructions: [
        {
          accounts: [
            { pubkey: fromPubkey, isSigner: true, isWritable: true },
            { pubkey: toPubkey, isSigner: false, isWritable: true },
          ],
          programId: params.SYSTEM_PROGRAM_ID,
          data: data,
        },
      ],
      recentBlockhash,
      feePayer: fromPubkey,
    };
  }

  static transferSplToken(
    signer: types.Address,
    fromTokenAccount: types.Address,
    toTokenAccount: types.Address,
    recentBlockhash: string,
    amount: number | string,
    decimals: number | string
  ): types.TransactionArgs {
    const decimalsNB = Number(decimals);
    return {
      txType: params.TRANSACTION_TYPE.SPL_TOKEN,
      instructions: [
        {
          accounts: [
            { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
            { pubkey: toTokenAccount, isSigner: false, isWritable: true },
            { pubkey: signer, isSigner: true, isWritable: true },
          ],
          programId: params.TOKEN_PROGRAM_ID,
          data: stringUtil.splDataEncode(amount, decimalsNB),
        },
      ],
      recentBlockhash,
      feePayer: signer,
      showDecimals: decimalsNB,
    };
  }
  static createTokenAssociateAccount(
    signer: types.Address,
    owner: types.Address,
    associateAccount: types.Address,
    token: types.Address,
    recentBlockhash: string
  ): types.TransactionArgs {
    return {
      instructions: [
        {
          accounts: [
            { pubkey: signer, isSigner: true, isWritable: true },
            { pubkey: associateAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: false },
            { pubkey: token, isSigner: false, isWritable: false },
            { pubkey: params.SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: params.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: params.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          ],
          programId: params.ASSOCIATED_TOKEN_PROGRAM_ID,
          data: '',
        },
      ],
      recentBlockhash,
      feePayer: signer,
    };
  }
  static createAccountWithSeed(
    fromPubkey: types.Address,
    newAccountPubkey: types.Address,
    basePubkey: types.Address,
    seed: string,
    lamports: number,
    space: number,
    programId: types.Address,
    recentBlockhash: string
  ): types.TransactionArgs {
    const basePubkeyStr = stringUtil.formHex(basePubkey);
    const fromPubkeyStr = stringUtil.formHex(fromPubkey);

    const data = encodeData(SystemProgramLayout.createWithSeed, {
      base: Buffer.from(basePubkeyStr, 'hex'),
      seed: seed,
      lamports: lamports,
      space: space,
      programId: Buffer.from(stringUtil.formHex(programId), 'hex'),
    });
    let keys = [
      { pubkey: fromPubkeyStr, isSigner: true, isWritable: true },
      { pubkey: stringUtil.formHex(newAccountPubkey), isSigner: false, isWritable: true },
    ];
    if (basePubkeyStr !== fromPubkeyStr) {
      keys.push({ pubkey: basePubkeyStr, isSigner: true, isWritable: false });
    }
    return new Transaction({
      instructions: [
        {
          accounts: keys,
          programId: params.SYSTEM_PROGRAM_ID,
          data,
        },
      ],
      recentBlockhash,
      feePayer: fromPubkey,
    });
  }
}
