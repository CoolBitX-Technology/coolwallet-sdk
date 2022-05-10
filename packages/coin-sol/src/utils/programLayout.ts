import * as BufferLayout from '@solana/buffer-layout';
import { publicKey, rustString, authorized, lockup, getAlloc } from './commonLayout';

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

export const SystemProgramLayout = {
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
      BufferLayout.u32('instruction'),
      publicKey('base'),
      rustString('seed'),
      BufferLayout.ns64('lamports'),
      BufferLayout.ns64('space'),
      publicKey('programId'),
    ]),
  },
};

type LockupRaw = Readonly<{
  custodian: Uint8Array;
  epoch: number;
  unixTimestamp: number;
}>;

type AuthorizedRaw = Readonly<{
  staker: Uint8Array;
  withdrawer: Uint8Array;
}>;

type StakeInstructionInputData = {
  Initialize: Readonly<{
    instruction: number;
    authorized: AuthorizedRaw;
    lockup: LockupRaw;
  }>;
  Delegate: InstructionInputData;
};

export const StakeProgramLayout = {
  Initialize: {
    index: 0,
    layout: BufferLayout.struct<StakeInstructionInputData['Initialize']>([
      BufferLayout.u32('instruction'),
      authorized(),
      lockup(),
    ]),
  },
  Delegate: {
    index: 2,
    layout: BufferLayout.struct<StakeInstructionInputData['Delegate']>([BufferLayout.u32('instruction')]),
  },
};

export function encodeData<TInputData extends InstructionInputData>(
  layoutType: InstructionLayoutType<TInputData>,
  fields?: any
): Buffer {
  const allocLength = layoutType.layout.span >= 0 ? layoutType.layout.span : getAlloc(layoutType, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({ instruction: layoutType.index }, fields);
  layoutType.layout.encode(layoutFields, data);
  return data;
}
