import { COMPUTE_BUDGET_PROGRAM_ID, PACKET_DATA_SIZE, SYSTEM_PROGRAM_ID } from '../config/params';
import { SerializedInstruction } from '../config/types';
import { structInstructionLayout, structInstructionLayoutWithoutData, structSignDataLayout } from './bufferLayoutUtils';
import { hasSpecificInstruction, isSpecificInstruction } from './instructions';

export interface InsructionBufferInfo {
  instructionBuffer: Buffer;
  instructionBufferLength: number;
}
function initializeInsructionBuffer(instructionCount?: number[]): InsructionBufferInfo {
  const instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
  if (instructionCount) {
    Buffer.from(instructionCount).copy(instructionBuffer);
  }
  const instructionBufferLength = !instructionCount ? 0 : instructionCount.length;
  return {
    instructionBuffer,
    instructionBufferLength,
  };
}

function paddingEmptyInstructionBuffer(params: {
  paddingLength: number;
  sourceInstructionBuf: Buffer;
  sourceInstructionLength: number;
}): InsructionBufferInfo {
  const { paddingLength, sourceInstructionBuf, sourceInstructionLength } = params;
  const emptyPaddingBuf = Buffer.alloc(paddingLength);
  emptyPaddingBuf.copy(sourceInstructionBuf, sourceInstructionLength);
  return {
    instructionBuffer: sourceInstructionBuf,
    instructionBufferLength: sourceInstructionLength + paddingLength,
  };
}

function paddingEmptyComputeBudgetInsructionBuffer(
  srcInstructionBuffer: Buffer,
  srcInstructionBufferLength: number,
  hasGasPriceComputeBudget: boolean,
  hasGasLimitComputeBudget: boolean
): InsructionBufferInfo {
  let instructionBuffer = srcInstructionBuffer;
  let instructionBufferLength = srcInstructionBufferLength;
  if (!hasGasPriceComputeBudget) {
    const paddingEmptyGasPrice = paddingEmptyInstructionBuffer({
      paddingLength: 12,
      sourceInstructionBuf: srcInstructionBuffer,
      sourceInstructionLength: srcInstructionBufferLength,
    });
    instructionBuffer = paddingEmptyGasPrice.instructionBuffer;
    instructionBufferLength = paddingEmptyGasPrice.instructionBufferLength;
  }
  if (!hasGasLimitComputeBudget) {
    const paddingEmptyGasLimit = paddingEmptyInstructionBuffer({
      paddingLength: 8,
      sourceInstructionBuf: instructionBuffer,
      sourceInstructionLength: instructionBufferLength,
    });
    instructionBuffer = paddingEmptyGasLimit.instructionBuffer;
    instructionBufferLength = paddingEmptyGasLimit.instructionBufferLength;
  }
  return {
    instructionBuffer,
    instructionBufferLength,
  };
}

export function initAndPaddingComputeBudgetInstructionBuffer(
  accountKeys: string[],
  instructions: SerializedInstruction[],
  instructionCount?: number[]
): InsructionBufferInfo {
  const initializeInstruction = initializeInsructionBuffer(instructionCount);
  const hasGasPriceComputeBudget = hasSpecificInstruction(accountKeys, instructions, COMPUTE_BUDGET_PROGRAM_ID, 3);
  const hasGasLimitComputeBudget = hasSpecificInstruction(accountKeys, instructions, COMPUTE_BUDGET_PROGRAM_ID, 2);
  const paddingInstruction = paddingEmptyComputeBudgetInsructionBuffer(
    initializeInstruction.instructionBuffer,
    initializeInstruction.instructionBufferLength,
    hasGasPriceComputeBudget,
    hasGasLimitComputeBudget
  );
  return {
    instructionBuffer: paddingInstruction.instructionBuffer,
    instructionBufferLength: paddingInstruction.instructionBufferLength,
  };
}

export function paddingSeedInstructionBuffer(
  srcInstructionBuffer: Buffer,
  srcInstructionBufferLength: number,
  seedData: number[]
): InsructionBufferInfo {
  /*
    Since seed is length variant, trying to padding seed to length 32 bytes:

    Default structure:
      instruction(4 bytes),
      basePubkey(32 bytes),
      length(4 bytes),
      lengthPadding(4 bytes),
      seed(variant),
      lamports(8 bytes),
      space(8 bytes),
      programId(32 bytes)

    After structure:
      instruction(4 bytes),
      basePubkey(32 bytes),
      length(4 bytes),
      lengthPadding(4 bytes),
      seed(32 bytes),
      lamports(8 bytes),
      space(8 bytes),
      programId(32 bytes)
  */
  const defaultLength = 92;
  const prefixLength = 44;
  const seedLength = seedData.length - defaultLength;
  const dataAllocator = Buffer.allocUnsafe(seedData.length - seedLength + 32);
  const dataPrefix = Buffer.from(seedData.slice(0, prefixLength));
  const seed = Buffer.from(seedData.slice(prefixLength, prefixLength + seedLength));
  const dataPostfix = Buffer.from(seedData.slice(prefixLength + seedLength, seedData.length));
  const paddingSeed = Buffer.alloc(32);
  seed.copy(paddingSeed, 32 - seed.length);
  dataPrefix.copy(dataAllocator, 0);
  paddingSeed.copy(dataAllocator, dataPrefix.length);
  dataPostfix.copy(dataAllocator, dataPrefix.length + paddingSeed.length);
  const copiedBufferLength = dataAllocator.copy(srcInstructionBuffer, srcInstructionBufferLength);
  return {
    instructionBuffer: srcInstructionBuffer,
    instructionBufferLength: srcInstructionBufferLength + copiedBufferLength,
  };
}

export function encodeInstructionBuffer(
  instructions: SerializedInstruction[],
  srcInstructionBuffer: Buffer,
  srcInstructionBufferLength: number
): Buffer {
  const instructionBuffer = srcInstructionBuffer;
  let instructionBufferLength = srcInstructionBufferLength;
  instructions.forEach((instruction) => {
    const instructionLayout = structInstructionLayout(instruction);
    instructionBufferLength += instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
  });
  return instructionBuffer.slice(0, instructionBufferLength);
}

export function encodeAndPaddingSeedInstructionBuffer(
  accountKeys: string[],
  instructions: SerializedInstruction[],
  srcInstructionBuffer: Buffer,
  srcInstructionBufferLength: number
): Buffer {
  let instructionBuffer = srcInstructionBuffer;
  let instructionBufferLength = srcInstructionBufferLength;
  instructions.forEach((instruction) => {
    let instructionLayout;
    const isCreateSeedInstruction = isSpecificInstruction(accountKeys, instruction, SYSTEM_PROGRAM_ID, 3);
    if (isCreateSeedInstruction) {
      instructionLayout = structInstructionLayoutWithoutData(instruction);
      instructionBufferLength += instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
      const paddingSeedInstruction = paddingSeedInstructionBuffer(
        instructionBuffer,
        instructionBufferLength,
        instruction.data
      );
      instructionBuffer = paddingSeedInstruction.instructionBuffer;
      instructionBufferLength = paddingSeedInstruction.instructionBufferLength;
    } else {
      instructionLayout = structInstructionLayout(instruction);
      instructionBufferLength += instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
    }
  });
  return instructionBuffer.slice(0, instructionBufferLength);
}

export function encodeSignData(
  keyCount: number[],
  newAccountKeys: string[],
  recentBlockhash: string,
  instructionBuffer: Buffer
): Buffer {
  const signDataLayout = structSignDataLayout(keyCount, newAccountKeys);
  const transaction = {
    keyCount: Buffer.from(keyCount),
    keys: newAccountKeys.map((key) => Buffer.from(key, 'hex')),
    recentBlockhash: Buffer.from(recentBlockhash, 'hex'),
  };
  const signData = Buffer.alloc(2048); // sign data max length
  const length = signDataLayout.encode(transaction, signData);
  instructionBuffer.copy(signData, length);
  return signData.slice(0, length + instructionBuffer.length);
}
