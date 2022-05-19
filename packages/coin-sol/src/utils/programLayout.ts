import * as BufferLayout from '@solana/buffer-layout';
import * as types from '../config/types';
import { publicKey, rustString, authorized, lockup } from './commonLayout';

interface InstructionInputData {
  readonly instruction: number;
}

type InstructionLayoutType<TInputData extends InstructionInputData> = {
  index: number;
  layout: BufferLayout.Layout<TInputData>;
};

type SystemInstructionInputData = {
  CreateWithSeed: InstructionInputData & {
    base: Uint8Array;
    lamports: number;
    programId: Uint8Array;
    seed: string;
    space: number;
  };
  Transfer: InstructionInputData & {
    lamports: number;
  };
};

const SystemProgramLayout = {
  Transfer: {
    index: 2,
    layout: BufferLayout.struct<SystemInstructionInputData['Transfer']>([
      BufferLayout.u32('instruction'),
      BufferLayout.ns64('lamports'),
    ]),
  },
  createWithSeed: {
    index: 3,
    layout: BufferLayout.struct<SystemInstructionInputData['CreateWithSeed']>([
      BufferLayout.u32('instruction'), // 4
      publicKey('base'), // 32
      rustString('seed'), // 8 + variant
      BufferLayout.ns64('lamports'), // 8
      BufferLayout.ns64('space'), // 8
      publicKey('programId'), // 32
    ]),
  },
};

type StakeInstructionInputData = {
  Initialize: Readonly<{
    instruction: number;
    authorized: types.AuthorizedRaw;
    lockup: types.LockupRaw;
  }>;
  Deactivate: InstructionInputData;
  Delegate: InstructionInputData;
  Withdraw: Readonly<{
    instruction: number;
    lamports: number;
  }>;
};

const StakeProgramLayout = {
  Initialize: {
    index: 0,
    layout: BufferLayout.struct<StakeInstructionInputData['Initialize']>([
      BufferLayout.u32('instruction'), // 4
      authorized(), // 64
      lockup(), // 48
    ]),
  },
  Delegate: {
    index: 2,
    layout: BufferLayout.struct<StakeInstructionInputData['Delegate']>([BufferLayout.u32('instruction')]),
  },
  Withdraw: {
    index: 4,
    layout: BufferLayout.struct<StakeInstructionInputData['Withdraw']>([
      BufferLayout.u32('instruction'),
      BufferLayout.ns64('lamports'),
    ]),
  },
  Deactivate: {
    index: 5,
    layout: BufferLayout.struct<StakeInstructionInputData['Deactivate']>([BufferLayout.u32('instruction')]),
  },
};

export {
  InstructionInputData,
  InstructionLayoutType,
  SystemInstructionInputData,
  StakeInstructionInputData,
  SystemProgramLayout,
  StakeProgramLayout,
};
