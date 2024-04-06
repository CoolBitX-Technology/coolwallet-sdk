import {
  STAKE_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  STAKE_CONFIG_ID,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  COMPUTE_BUDGET_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '../config/params';
import { StakeProgramLayout, SystemProgramLayout } from './programLayout';
import { encodeData } from './commonLayout';
import { formHex, computeBudgetEncode, splDataEncode } from './stringUtil';
import * as types from '../config/types';
import { ComputeBudgetInstruction, SerializedInstruction } from '../config/types';

function addComputeBudget(params: {
  computeUnitPrice?: string;
  computeUnitLimit?: string;
}): types.TransactionInstruction[] {
  const computeUnitInstructions = [];
  if (params.computeUnitPrice) {
    computeUnitInstructions.push({
      accounts: [],
      programId: COMPUTE_BUDGET_PROGRAM_ID,
      data: computeBudgetEncode(ComputeBudgetInstruction.SetComputeUnitPrice, params.computeUnitPrice),
    });
  }
  if (params.computeUnitLimit) {
    computeUnitInstructions.push({
      accounts: [],
      programId: COMPUTE_BUDGET_PROGRAM_ID,
      data: computeBudgetEncode(ComputeBudgetInstruction.SetComputeUnitLimit, params.computeUnitLimit),
    });
  }
  return computeUnitInstructions;
}

function createAssociateTokenAccount(params: {
  signer: types.Address;
  associateAccount: types.Address;
  owner: types.Address;
  token: types.Address;
  programId: types.Address;
}): types.TransactionInstruction {
  const { signer, associateAccount, owner, token, programId } = params;
  return {
    accounts: [
      { pubkey: signer, isSigner: true, isWritable: true },
      { pubkey: associateAccount, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: token, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: programId, isSigner: false, isWritable: false },
      // { pubkey: params.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  };
}

function createAccountWithSeed(params: {
  fromPubkey: types.Address;
  newAccountPubkey: types.Address;
  basePubkey: types.Address;
  seed: string;
  lamports: string | number;
  space: number;
  programId: types.Address;
}): types.TransactionInstruction {
  const { fromPubkey, basePubkey, seed, space, lamports, programId, newAccountPubkey } = params;
  const basePubkeyStr = formHex(basePubkey);
  const fromPubkeyStr = formHex(fromPubkey);

  const data = encodeData(SystemProgramLayout.createWithSeed, {
    base: Buffer.from(basePubkeyStr, 'hex'),
    seed,
    lamports,
    space,
    programId: Buffer.from(formHex(programId), 'hex'),
  });

  const keys = [
    { pubkey: fromPubkeyStr, isSigner: true, isWritable: true },
    { pubkey: formHex(newAccountPubkey), isSigner: false, isWritable: true },
  ];

  return {
    accounts: keys,
    programId: SYSTEM_PROGRAM_ID,
    data,
  };
}

function initialize(params: {
  stakePubkey: types.Address;
  staker: types.Address;
  withdrawer: types.Address;
  unixTimestamp?: number;
  epoch?: number;
}): types.TransactionInstruction {
  const { staker, withdrawer, stakePubkey } = params;
  const data = encodeData(StakeProgramLayout.Initialize, {
    authorized: {
      staker: Buffer.from(formHex(staker), 'hex'),
      withdrawer: Buffer.from(formHex(withdrawer), 'hex'),
    },
    lockup: {
      unixTimestamp: params.unixTimestamp ?? 0,
      epoch: params.epoch ?? 0,
      custodian: Buffer.alloc(32),
    },
  });

  return {
    accounts: [
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: STAKE_PROGRAM_ID,
    data,
  };
}

function delegate(params: {
  stakePubkey: types.Address;
  authorizedPubkey: types.Address;
  votePubkey: types.Address;
}): types.TransactionInstruction {
  const { stakePubkey, authorizedPubkey, votePubkey } = params;
  const data = encodeData(StakeProgramLayout.Delegate);

  return {
    accounts: [
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: votePubkey, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      {
        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: STAKE_CONFIG_ID, isSigner: false, isWritable: false },
      { pubkey: authorizedPubkey, isSigner: true, isWritable: false },
    ],
    programId: STAKE_PROGRAM_ID,
    data,
  };
}

function undelegate(params: {
  stakePubkey: types.Address;
  authorizedPubkey: types.Address;
}): types.TransactionInstruction {
  const { stakePubkey, authorizedPubkey } = params;
  const data = encodeData(StakeProgramLayout.Deactivate);
  return {
    accounts: [
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: authorizedPubkey, isSigner: true, isWritable: false },
    ],
    programId: STAKE_PROGRAM_ID,
    data,
  };
}

function withdraw(params: {
  stakePubkey: types.Address;
  withdrawToPubKey: types.Address;
  authorizedPubkey: types.Address;
  lamports: string | number;
}): types.TransactionInstruction {
  const { stakePubkey, withdrawToPubKey, authorizedPubkey, lamports } = params;
  const data = encodeData(StakeProgramLayout.Withdraw, {
    lamports: +lamports,
  });
  return {
    accounts: [
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: withdrawToPubKey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      {
        pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: authorizedPubkey, isSigner: true, isWritable: false },
    ],
    programId: STAKE_PROGRAM_ID,
    data,
  };
}

function transferCoin(params: {
  fromPubkey: types.Address;
  toPubkey: types.Address;
  lamports: number | string;
}): types.TransactionInstruction {
  const { fromPubkey, toPubkey, lamports } = params;
  const data = encodeData(SystemProgramLayout.Transfer, {
    lamports,
  });
  return {
    accounts: [
      { pubkey: fromPubkey, isSigner: true, isWritable: true },
      { pubkey: toPubkey, isSigner: false, isWritable: true },
    ],
    programId: SYSTEM_PROGRAM_ID,
    data,
  };
}

function transferSplToken(params: {
  signer: types.Address;
  fromTokenAccount: types.Address;
  toTokenAccount: types.Address;
  amount: number | string;
  programId: types.TokenProgramId;
  tokenInfo: types.TokenInfo;
}): types.TransactionInstruction {
  const { signer, fromTokenAccount, toTokenAccount, amount, tokenInfo, programId } = params;
  const data = splDataEncode(amount, tokenInfo.decimals);
  return {
    accounts: [
      { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenInfo.address, isSigner: false, isWritable: false },
      { pubkey: toTokenAccount, isSigner: false, isWritable: true },
      { pubkey: signer, isSigner: true, isWritable: false },
    ],
    programId,
    data,
  };
}

function isCreateSeedInstruction(accountKeys: string[], instruction: SerializedInstruction): boolean {
  const { programIdIndex, data } = instruction;
  const programId = accountKeys?.[programIdIndex];
  return programId === SYSTEM_PROGRAM_ID.toString('hex') && data?.[0] === 3;
}

export {
  createAccountWithSeed,
  initialize,
  delegate,
  undelegate,
  withdraw,
  addComputeBudget,
  transferCoin,
  transferSplToken,
  createAssociateTokenAccount,
  isCreateSeedInstruction,
};
