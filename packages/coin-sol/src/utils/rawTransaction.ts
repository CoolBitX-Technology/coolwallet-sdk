import * as types from '../config/types';
import * as params from '../config/params';
import * as instructionsTemplate from './instructions';

function compileTransferTransaction(transaction: {
  fromPubkey: types.Address;
  toPubkey: types.Address;
  recentBlockhash: string;
  lamports: number | string;
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { fromPubkey, toPubkey, recentBlockhash, lamports } = transaction;
  const computeBudgetInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const coinInstruction = instructionsTemplate.transferCoin({
    fromPubkey,
    toPubkey,
    lamports,
  });
  return {
    instructions: [...computeBudgetInstructions, coinInstruction],
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
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { signer, fromTokenAccount, toTokenAccount, amount, recentBlockhash, programId, tokenInfo } = transaction;
  const computeBudgetInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const splTokenInstruction = instructionsTemplate.transferSplToken({
    signer,
    fromTokenAccount,
    toTokenAccount,
    amount,
    programId,
    tokenInfo,
  });
  return {
    instructions: [...computeBudgetInstructions, splTokenInstruction],
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
  const createTokenInstruction = instructionsTemplate.createAssociateTokenAccount({
    signer,
    owner,
    associateAccount,
    token,
    programId,
  });
  return {
    instructions: [createTokenInstruction],
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
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { feePayer, recentBlockhash } = transaction;
  const computeBudgetInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const delegateInstruction = instructionsTemplate.delegate(transaction);
  return {
    instructions: [...computeBudgetInstructions, delegateInstruction],
    recentBlockhash,
    feePayer,
  };
}

function compileUndelegate(transaction: {
  feePayer: types.Address;
  recentBlockhash: string;
  stakePubkey: types.Address;
  authorizedPubkey: types.Address;
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { stakePubkey, authorizedPubkey, feePayer, recentBlockhash } = transaction;
  const computeBudgetInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const undelegateInstruction = instructionsTemplate.undelegate({
    stakePubkey,
    authorizedPubkey,
  });
  return {
    instructions: [...computeBudgetInstructions, undelegateInstruction],
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
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { fromPubkey, newAccountPubkey, basePubkey, seed, lamports, recentBlockhash, votePubkey } = transaction;
  const computeUnitInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const createAccountWithSeedInstruction = instructionsTemplate.createAccountWithSeed({
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
    staker: fromPubkey,
    withdrawer: fromPubkey,
  });
  const delegateInstruction = instructionsTemplate.delegate({
    stakePubkey: newAccountPubkey,
    authorizedPubkey: fromPubkey,
    votePubkey,
  });
  return {
    instructions: [
      ...computeUnitInstructions,
      createAccountWithSeedInstruction,
      initializeInstruction,
      delegateInstruction,
    ],
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
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionArgs {
  const { authorizedPubkey, stakePubkey, withdrawToPubKey, recentBlockhash, lamports } = transaction;
  const computeBudgetInstructions = instructionsTemplate.addComputeBudget({
    computeUnitPrice: transaction.computeUnitPrice,
    computeUnitLimit: transaction.computeUnitLimit,
  });
  const withdrawInstruction = instructionsTemplate.withdraw({
    stakePubkey,
    withdrawToPubKey,
    authorizedPubkey,
    lamports,
  });

  return {
    instructions: [...computeBudgetInstructions, withdrawInstruction],
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
