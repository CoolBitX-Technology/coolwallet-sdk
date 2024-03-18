import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import { StakeProgramLayout, SystemProgramLayout } from './programLayout';
import { encodeData } from './commonLayout';
import * as instructionsTemplate from './instructions';
import { ComputeBudgetInstruction } from '../config/types';

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
  programId: types.TokenProgramId;
  tokenInfo: types.TokenInfo;
  gasPrice?: number | string;
  gasLimit?: number | string;
}): types.TransactionArgs {
  const { signer, fromTokenAccount, toTokenAccount, amount, recentBlockhash, programId, tokenInfo } = transaction;
  const instructions = [];
  if (transaction.gasPrice) {
    instructions.push({
      accounts: [],
      programId: params.COMPUTE_BUDGET_PROGRAM_ID,
      data: stringUtil.computeBudgetEncode(ComputeBudgetInstruction.SetComputeUnitPrice, transaction.gasPrice),
    });
  }
  if (transaction.gasLimit) {
    instructions.push({
      accounts: [],
      programId: params.COMPUTE_BUDGET_PROGRAM_ID,
      data: stringUtil.computeBudgetEncode(ComputeBudgetInstruction.SetComputeUnitLimit, transaction.gasLimit),
    });
  }
  instructions.push({
    accounts: [
      { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenInfo.address, isSigner: false, isWritable: false },
      { pubkey: toTokenAccount, isSigner: false, isWritable: true },
      { pubkey: signer, isSigner: true, isWritable: false },
    ],
    programId,
    data: stringUtil.splDataEncode(amount, tokenInfo.decimals),
  });
  return {
    instructions,
    recentBlockhash,
    feePayer: signer,
  };
}

function compileAssociateTokenAccount(transaction: {
  signer: types.Address;
  owner: types.Address;
  associateAccount: types.Address;
  token: types.Address;
  recentBlockhash: string;
  programId: types.TokenProgramId;
}): types.TransactionArgs {
  const { signer, owner, associateAccount, token, recentBlockhash, programId } = transaction;

  return {
    instructions: [
      {
        accounts: [
          { pubkey: signer, isSigner: true, isWritable: true },
          { pubkey: associateAccount, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: false, isWritable: false },
          { pubkey: token, isSigner: false, isWritable: false },
          { pubkey: params.SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: programId, isSigner: false, isWritable: false },
          // { pubkey: params.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
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
  const delegateInstruction = instructionsTemplate.delegate(transaction);
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
  const createAccountWithSeedInstructions = instructionsTemplate.createAccountWithSeed({
    fromPubkey,
    newAccountPubkey,
    basePubkey,
    seed,
    space: 200,
    lamports,
    programId: params.STAKE_PROGRAM_ID,
  });
  const initializeInstruction = instructionsTemplate.initialize({
    stakePubkey: newAccountPubkey,
    authorized: {
      staker: Buffer.from(stringUtil.formHex(fromPubkey), 'hex'),
      withdrawer: Buffer.from(stringUtil.formHex(fromPubkey), 'hex'),
    },
  });
  const delegateInstruction = instructionsTemplate.delegate({
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

function compileStakingWithdraw(transaction: {
  authorizedPubkey: types.Address;
  stakePubkey: types.Address;
  withdrawToPubKey: types.Address;
  recentBlockhash: string;
  lamports: number | string;
}): types.TransactionArgs {
  const { authorizedPubkey, stakePubkey, withdrawToPubKey, recentBlockhash, lamports } = transaction;
  const data = encodeData(StakeProgramLayout.Withdraw, {
    lamports: +lamports,
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

  return {
    instructions: [
      {
        accounts,
        programId: params.STAKE_PROGRAM_ID,
        data,
      },
    ],
    recentBlockhash,
    feePayer: authorizedPubkey,
  };
}

export {
  compileTransferTransaction,
  compileSplTokenTransaction,
  compileAssociateTokenAccount,
  compileDelegate,
  compileUndelegate,
  compileDelegateAndCreateAccountWithSeed,
  compileStakingWithdraw,
};
