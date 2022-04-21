import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import { encodeData, SystemProgramLayout } from './layoutUtil';
import { Transaction } from './transactionUtil';
import { TOKEN_INFO } from '../config/tokenInfos';

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
    tokenInfo: {
      name?: string;
      symbol: string;
      address?: string;
      decimals?: number | string;
      signature?: string;
    }
  ): types.TransactionArgs {
    // check is symbol is valid by length
    if (tokenInfo.symbol.length > 7) throw new Error('Spl token symbol must have the length between 1 to 7 character');

    // find token with match at least token symbol condition
    const supportedToken = TOKEN_INFO.find((e) => {
      const isEqualName = tokenInfo.name ? e.name === tokenInfo.name : true;
      const isEqualAddress = tokenInfo.address ? e.address === tokenInfo.address : true;
      const isEqualDecimals = tokenInfo.decimals ? e.decimals === Number(tokenInfo.decimals) : true;
      const isEqualSymbol = e.symbol === tokenInfo.symbol.toUpperCase();
      return isEqualName && isEqualSymbol && isEqualAddress && isEqualDecimals;
    });

    // valid token input is at least supported by coolX or have valid token address and decimal
    if (!tokenInfo.address && !tokenInfo.decimals && !supportedToken)
      throw new Error("Your spl token you provided was not supported by CoolX or didn't exist");

    // if not supported by coolX, assign to user input
    const tokenInfoArgs = supportedToken ? supportedToken : (tokenInfo as types.TokenInfo);

    // token address must be in base58 format
    if (!stringUtil.isBase58Format(tokenInfoArgs.address)) throw new Error('Spl token address must be base58 format');

    // handle if user input was string
    tokenInfoArgs.decimals = Number(tokenInfoArgs.decimals);
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
          data: stringUtil.splDataEncode(amount, tokenInfoArgs.decimals),
        },
      ],
      recentBlockhash,
      feePayer: signer,
      showTokenInfo: tokenInfoArgs,
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
