import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';

export default class TransactionCreator {
  constructor() {}

  static transfer(
    fromPubkey: types.Address,
    toPubkey: types.Address,
    recentBlockhash: string,
    amount: number | string
  ): types.TransactionArgs {
    return {
      txType: params.TRANSACTION_TYPE.TRANSFER,
      instructions: [
        {
          accounts: [
            { pubkey: fromPubkey, isSigner: true, isWritable: true },
            { pubkey: toPubkey, isSigner: false, isWritable: true },
          ],
          programId: params.SYSTEM_PROGRAM_ID,
          data: stringUtil.transferDataEncode(amount),
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
  static createAssociateAccount(
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
}
