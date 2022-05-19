import {
  STAKE_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  STAKE_CONFIG_ID,
  SYSVAR_STAKE_HISTORY_PUBKEY,
} from '../config/params';
import { StakeProgramLayout, SystemProgramLayout } from './programLayout';
import { encodeData } from './commonLayout';
import { formHex } from './stringUtil';
import * as types from '../config/types';

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
  authorized: types.AuthorizedRaw;
}): types.TransactionInstruction {
  const { authorized, stakePubkey } = params;
  const data = encodeData(StakeProgramLayout.Initialize, {
    authorized,
    lockup: {
      unixTimestamp: 0,
      epoch: 0,
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

function delegate(params: { stakePubkey: types.Address; authorizedPubkey: types.Address; votePubkey: types.Address }) {
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

export { createAccountWithSeed, initialize, delegate };
