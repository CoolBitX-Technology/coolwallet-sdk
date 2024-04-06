import * as BufferLayout from '@solana/buffer-layout';
import { SerializedInstruction } from '../config/types';
import { publicKey } from './commonLayout';

export function structInstructionLayoutWithoutData(instruction: SerializedInstruction) {
  return BufferLayout.struct<
    Readonly<{
      dataLength: Uint8Array;
      keyIndices: number[];
      keyIndicesCount: Uint8Array;
      programIdIndex: number;
    }>
  >([
    BufferLayout.u8('programIdIndex'),
    BufferLayout.blob(instruction.keyIndicesCount.length, 'keyIndicesCount'),
    BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
    BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
  ]);
}

export function structInstructionLayoutWithoutDataAndKeyIndicesCount(instruction: SerializedInstruction) {
  return BufferLayout.struct<
    Readonly<{
      dataLength: Uint8Array;
      keyIndices: number[];
      programIdIndex: number;
    }>
  >([
    BufferLayout.u8('programIdIndex'),
    BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
    BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
  ]);
}

export function structInstructionLayoutWithoutKeyIndicesCount(instruction: SerializedInstruction) {
  return BufferLayout.struct<
    Readonly<{
      data: number[];
      dataLength: Uint8Array;
      keyIndices: number[];
      programIdIndex: number;
    }>
  >([
    BufferLayout.u8('programIdIndex'),
    BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
    BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
    BufferLayout.seq(BufferLayout.u8('userdatum'), instruction.data.length, 'data'),
  ]);
}

export function structInstructionLayout(instruction: SerializedInstruction) {
  return BufferLayout.struct<
    Readonly<{
      data: number[];
      dataLength: Uint8Array;
      keyIndices: number[];
      keyIndicesCount: Uint8Array;
      programIdIndex: number;
    }>
  >([
    BufferLayout.u8('programIdIndex'),
    BufferLayout.blob(instruction.keyIndicesCount.length, 'keyIndicesCount'),
    BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
    BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
    BufferLayout.seq(BufferLayout.u8('userdatum'), instruction.data.length, 'data'),
  ]);
}

export function structSignDataLayout(keyCount: number[], accountKeys: string[]) {
  return BufferLayout.struct<
    Readonly<{
      keyCount: Uint8Array;
      keys: Uint8Array[];
      recentBlockhash: Uint8Array;
    }>
  >([
    BufferLayout.blob(keyCount.length, 'keyCount'),
    BufferLayout.seq(publicKey('key'), accountKeys.length, 'keys'),
    publicKey('recentBlockhash'),
  ]);
}
