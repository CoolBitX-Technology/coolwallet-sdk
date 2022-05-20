import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import { encodeData, SystemProgramLayout, StakeProgramLayout } from './programLayout';
import Transaction from './Transaction';
import { TOKEN_INFO } from '../config/tokenInfos';

function compileTransferTransaction(transaction: {
  fromPubKey: types.Address;
  toPubKey: types.Address;
  recentBlockhash: string;
  amount: number | string;
}): types.TransactionArgs {
  const { fromPubKey, toPubKey, recentBlockhash, amount } = transaction;
  const data = encodeData(SystemProgramLayout.Transfer, {
    lamports: +amount * params.LAMPORTS_PER_SOL,
  });

  return {
    instructions: [
      {
        accounts: [
          { pubkey: fromPubKey, isSigner: true, isWritable: true },
          { pubkey: toPubKey, isSigner: false, isWritable: true },
        ],
        programId: params.SYSTEM_PROGRAM_ID,
        data,
      },
    ],
    recentBlockhash,
    feePayer: fromPubKey,
  };
}

function compileSplTokenTransaction(transaction: {
  signer: types.Address;
  fromTokenAccount: types.Address;
  toTokenAccount: types.Address;
  recentBlockhash: string;
  amount: number | string;
  tokenInfo: {
    symbol: string;
    decimals: number | string;
    address: string;
    signature?: string;
  };
}): types.TransactionArgs {
  const { signer, fromTokenAccount, toTokenAccount, amount, tokenInfo, recentBlockhash } = transaction;

  // find token with match at least token symbol condition
  const supportedToken = TOKEN_INFO.find((e) => e.address === tokenInfo.address);

  // valid token input is at least supported by coolX or have valid token address and decimal
  if (!tokenInfo?.symbol && !tokenInfo?.decimals) throw new Error('Please provide spl token symbol and decimals');

  // if not supported by coolX, assign to user input
  const tokenInfoArgs = supportedToken ?? tokenInfo;

  // handle if user input was string
  tokenInfoArgs.decimals = +tokenInfoArgs.decimals;

  // token address must be in base58 format
  if (!stringUtil.isBase58Format(tokenInfoArgs.address)) throw new Error('Spl token address must be base58 format');

  return {
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

function compileAssociateTokenAccount(transaction: {
  signer: types.Address;
  owner: types.Address;
  associateAccount: types.Address;
  token: types.Address;
  recentBlockhash: string;
}): types.TransactionArgs {
  const { signer, owner, associateAccount, token, recentBlockhash } = transaction;

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
        data: Buffer.alloc(0),
      },
    ],
    recentBlockhash,
    feePayer: signer,
  };
}

function compileCreateAccountWithSeed(transaction: {
  fromPubkey: types.Address;
  newAccountPubkey: types.Address;
  basePubkey: types.Address;
  seed: string;
  lamports: number;
  space: number;
  programId: types.Address;
  recentBlockhash: string;
}): types.TransactionArgs {
  const { fromPubkey, basePubkey, seed, space, lamports, programId, recentBlockhash, newAccountPubkey } = transaction;
  const basePubkeyStr = stringUtil.formHex(basePubkey);
  const fromPubkeyStr = stringUtil.formHex(fromPubkey);

  const data = encodeData(SystemProgramLayout.createWithSeed, {
    base: Buffer.from(basePubkeyStr, 'hex'),
    seed,
    lamports,
    space,
    programId: Buffer.from(stringUtil.formHex(programId), 'hex'),
  });
  const keys = [
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

function compileStakingWithdraw(transaction: {
  authorizedPubkey: types.Address;
  stakePubkey: types.Address;
  withdrawToPubKey: types.Address;
  recentBlockhash: string;
  amount: number | string;
}): types.TransactionArgs {
  const { authorizedPubkey, stakePubkey, withdrawToPubKey, recentBlockhash, amount } = transaction;
  const data = encodeData(StakeProgramLayout.Withdraw, {
    lamports: +amount * params.LAMPORTS_PER_SOL,
  });

  const accounts = [
    { pubkey: stakePubkey, isSigner: false, isWritable: true },
    { pubkey: withdrawToPubKey, isSigner: false, isWritable: true },
    { pubkey: params.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    {
      pubkey: params.SYSVAR_STAKE_HISTORY_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: authorizedPubkey, isSigner: true, isWritable: false },
  ];

  return new Transaction({
    instructions: [
      {
        accounts,
        programId: params.STAKE_PROGRAM_ID,
        data,
      }
    ],
    recentBlockhash,
    feePayer: authorizedPubkey,
  });
}

export {
  compileTransferTransaction,
  compileSplTokenTransaction,
  compileAssociateTokenAccount,
  compileCreateAccountWithSeed,
  compileStakingWithdraw,
};
