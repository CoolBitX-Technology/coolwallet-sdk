import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import { StakeProgramLayout, SystemProgramLayout } from './programLayout';
import { encodeData } from './commonLayout';
import * as instructions from './instructions';
import { TOKEN_INFO } from '../config/tokenInfos';

function compileTransferTransaction(transaction: {
  fromPubkey: types.Address;
  toPubkey: types.Address;
  recentBlockhash: string;
  lamports: number | string;
}): types.TransactionArgs {
  const { fromPubkey, toPubkey, recentBlockhash, lamports } = transaction;
  const data = encodeData(SystemProgramLayout.Transfer, {
    lamports,
  });

  return {
    instructions: [
      {
        accounts: [
          { pubkey: fromPubkey, isSigner: true, isWritable: true },
          { pubkey: toPubkey, isSigner: false, isWritable: true },
        ],
        programId: params.SYSTEM_PROGRAM_ID,
        data,
      },
    ],
    recentBlockhash,
    feePayer: fromPubkey,
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
        data: stringUtil.splDataEncode(amount),
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

function compileDelegate(transaction: {
  feePayer: types.Address;
  recentBlockhash: string;
  stakePubkey: types.Address;
  authorizedPubkey: types.Address;
  votePubkey: types.Address;
}): types.TransactionArgs {
  const { feePayer, recentBlockhash } = transaction;
  const delegateInstruction = instructions.delegate(transaction);
  return {
    instructions: [delegateInstruction],
    recentBlockhash,
    feePayer,
  };
}

function compileUndelegate(transaction: {
  feePayer: types.Address;
  recentBlockhash: string;
  stakePubkey: types.Address;
  authorizedPubkey: types.Address;
}): types.TransactionArgs {
  const { stakePubkey, authorizedPubkey, feePayer, recentBlockhash } = transaction;
  const data = encodeData(StakeProgramLayout.Deactivate);
  return {
    instructions: [
      {
        accounts: [
          { pubkey: stakePubkey, isSigner: false, isWritable: true },
          { pubkey: params.SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: authorizedPubkey, isSigner: true, isWritable: false },
        ],
        programId: params.STAKE_PROGRAM_ID,
        data,
      },
    ],
    feePayer,
    recentBlockhash,
  };
}

function compileDelegateAndCreateAccountWithSeed(transaction: {
  fromPubkey: types.Address;
  newAccountPubkey: types.Address;
  basePubkey: types.Address;
  votePubkey: types.Address;
  seed: string;
  lamports: string | number;
  recentBlockhash: string;
}): types.TransactionArgs {
  const { fromPubkey, newAccountPubkey, basePubkey, seed, lamports, recentBlockhash, votePubkey } = transaction;
  const createAccountWithSeedInstructions = instructions.createAccountWithSeed({
    fromPubkey,
    newAccountPubkey,
    basePubkey,
    seed,
    space: 200,
    lamports,
    programId: params.STAKE_PROGRAM_ID,
  });
  const initializeInstruction = instructions.initialize({
    stakePubkey: newAccountPubkey,
    authorized: {
      staker: Buffer.from(stringUtil.formHex(fromPubkey), 'hex'),
      withdrawer: Buffer.from(stringUtil.formHex(fromPubkey), 'hex'),
    },
  });
  const delegateInstruction = instructions.delegate({
    stakePubkey: newAccountPubkey,
    authorizedPubkey: fromPubkey,
    votePubkey,
  });
  return {
    instructions: [createAccountWithSeedInstructions, initializeInstruction, delegateInstruction],
    recentBlockhash,
    feePayer: fromPubkey,
  };
}

export {
  compileTransferTransaction,
  compileSplTokenTransaction,
  compileAssociateTokenAccount,
  compileDelegate,
  compileUndelegate,
  compileDelegateAndCreateAccountWithSeed,
};
