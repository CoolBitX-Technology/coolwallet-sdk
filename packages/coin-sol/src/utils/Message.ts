import * as BufferLayout from '@solana/buffer-layout';
import { encodeLength } from './stringUtil';
import { publicKey } from './commonLayout';
import { PACKET_DATA_SIZE } from '../config/params';
import { CompliedInstruction, SerializedInstruction } from '../config/types';

type MessageHeader = {
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
};

type MessageArgs = {
  header: MessageHeader;
  accountKeys: string[];
  recentBlockhash: string;
  instructions: CompliedInstruction[];
};

class Message {
  header: MessageHeader;
  accountKeys: string[];
  recentBlockhash: string;
  instructions: CompliedInstruction[];

  constructor(message: MessageArgs) {
    this.header = message.header;
    this.accountKeys = message.accountKeys;
    this.recentBlockhash = message.recentBlockhash;
    this.instructions = message.instructions;
  }

  encodedLength(): { keyCount: number[]; instructionCount: number[]; instructions: SerializedInstruction[] } {
    // encode key count
    const numKeys = this.accountKeys.length;
    const keyCount: number[] = [];
    encodeLength(keyCount, numKeys);

    // extract input instructions to serialize instructions
    const instructions = this.instructions.map((instruction) => {
      const { accounts, programIdIndex } = instruction;
      const data = Array.from(Buffer.from(instruction.data, 'hex'));

      const keyIndicesCount: number[] = [];
      encodeLength(keyIndicesCount, accounts.length);

      const dataCount: number[] = [];
      encodeLength(dataCount, data.length);

      return {
        programIdIndex,
        keyIndicesCount: Buffer.from(keyIndicesCount),
        keyIndices: accounts,
        dataLength: Buffer.from(dataCount),
        data,
      };
    });

    // encode instruction count
    const instructionCount: number[] = [];
    encodeLength(instructionCount, instructions.length);
    return { keyCount, instructionCount, instructions };
  }

  serialize(): string {
    const { keyCount, instructionCount, instructions } = this.encodedLength();
    // encode instruction
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    Buffer.from(instructionCount).copy(instructionBuffer);
    let instructionBufferLength = instructionCount.length;

    instructions.forEach((instruction) => {
      const instructionLayout = BufferLayout.struct<
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
      instructionBufferLength += instructionLayout.encode(instruction, instructionBuffer, instructionBufferLength);
    });
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);

    // encode sign data
    const signDataLayout = BufferLayout.struct<
      Readonly<{
        keyCount: Uint8Array;
        keys: Uint8Array[];
        numReadonlySignedAccounts: Uint8Array;
        numReadonlyUnsignedAccounts: Uint8Array;
        numRequiredSignatures: Uint8Array;
        recentBlockhash: Uint8Array;
      }>
    >([
      BufferLayout.blob(1, 'numRequiredSignatures'),
      BufferLayout.blob(1, 'numReadonlySignedAccounts'),
      BufferLayout.blob(1, 'numReadonlyUnsignedAccounts'),
      BufferLayout.blob(keyCount.length, 'keyCount'),
      BufferLayout.seq(publicKey('key'), this.accountKeys.length, 'keys'),
      publicKey('recentBlockhash'),
    ]);
    const transaction = {
      numRequiredSignatures: Buffer.from([this.header.numRequiredSignatures]),
      numReadonlySignedAccounts: Buffer.from([this.header.numReadonlySignedAccounts]),
      numReadonlyUnsignedAccounts: Buffer.from([this.header.numReadonlyUnsignedAccounts]),
      keyCount: Buffer.from(keyCount),
      keys: this.accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeTransferMessage(): string {
    const { keyCount, instructions } = this.encodedLength();
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    const [instruction] = instructions;
    const instructionLayout = BufferLayout.struct<
      Readonly<{
        data: number[];
        dataLength: Uint8Array;
        keyIndices: number[];
      }>
    >([
      BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
      BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
      BufferLayout.seq(BufferLayout.u8('userdatum'), instruction.data.length, 'data'),
    ]);
    const instructionBufferLength = instructionLayout.encode(instruction, instructionBuffer, 0);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    const signDataLayout = BufferLayout.struct<
      Readonly<{
        keyCount: Uint8Array;
        keys: Uint8Array[];
        recentBlockhash: Uint8Array;
      }>
    >([
      BufferLayout.blob(keyCount.length, 'keyCount'),
      BufferLayout.seq(publicKey('key'), this.accountKeys.length, 'keys'),
      publicKey('recentBlockhash'),
    ]);
    const transaction = {
      keyCount: Buffer.from(keyCount),
      keys: this.accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeAssociateTokenAccount(): string {
    const { keyCount, instructions } = this.encodedLength();
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    const [instruction] = instructions;
    const instructionLayout = BufferLayout.struct<
      Readonly<{
        programIdIndex: number;
        keyIndices: number[];
        dataLength: Uint8Array;
      }>
    >([
      BufferLayout.u8('programIdIndex'),
      BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
      BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
    ]);
    const instructionBufferLength = instructionLayout.encode(instruction, instructionBuffer, 0);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    // Account length will be 7 or 8, depends on whether signer is same as owner.
    let accountKeys;
    if (this.accountKeys.length === 7) {
      // Padding argument.
      accountKeys = [...this.accountKeys, Buffer.alloc(32).toString('hex')];
    } else {
      accountKeys = this.accountKeys;
    }
    const signDataLayout = BufferLayout.struct<
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
    const transaction = {
      keyCount: Buffer.from(keyCount),
      keys: accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeDelegate(): string {
    const { instructions } = this.encodedLength();
    const [instruction] = instructions;
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    const instructionLayout = BufferLayout.struct<
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
    const instructionBufferLength = instructionLayout.encode(instruction, instructionBuffer, 0);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);

    const signDataLayout = BufferLayout.struct<
      Readonly<{
        keys: Uint8Array[];
        recentBlockhash: Uint8Array;
      }>
    >([BufferLayout.seq(publicKey('key'), this.accountKeys.length, 'keys'), publicKey('recentBlockhash')]);
    const transaction = {
      keys: this.accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeUndelegate(): string {
    const { instructions } = this.encodedLength();
    const [instruction] = instructions;
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    const instructionLayout = BufferLayout.struct<
      Readonly<{
        keyIndices: number[];
        programIdIndex: number;
      }>
    >([
      BufferLayout.u8('programIdIndex'),
      BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
    ]);
    const instructionBufferLength = instructionLayout.encode(instruction, instructionBuffer, 0);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);

    const signDataLayout = BufferLayout.struct<
      Readonly<{
        keys: Uint8Array[];
        recentBlockhash: Uint8Array;
      }>
    >([BufferLayout.seq(publicKey('key'), this.accountKeys.length, 'keys'), publicKey('recentBlockhash')]);
    const transaction = {
      keys: this.accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);

    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeDelegateAndCreateAccountWithSeed(): string {
    const defaultLength = 92;
    const prefixLength = 44;
    const { instructions } = this.encodedLength();
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    let instructionBufferLength = 0;
    const [createAccountWithSeedInstruction, initializeInstruction, delegateInstruction] = instructions;
    function getInstructionLayout(instruction: SerializedInstruction) {
      return BufferLayout.struct<
        Readonly<{
          data: number[];
          programIdIndex: number;
          keyIndices: number[];
          dataLength: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), instruction.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), instruction.data.length, 'data'),
      ]);
    }
    const createAccountWithSeedLayout = BufferLayout.struct<
      Readonly<{
        programIdIndex: number;
        keyIndices: number[];
        dataLength: Uint8Array;
      }>
    >([
      BufferLayout.u8('programIdIndex'),
      BufferLayout.seq(BufferLayout.u8('keyIndex'), createAccountWithSeedInstruction.keyIndices.length, 'keyIndices'),
      BufferLayout.blob(createAccountWithSeedInstruction.dataLength.length, 'dataLength'),
    ]);
    instructionBufferLength += createAccountWithSeedLayout.encode(
      createAccountWithSeedInstruction,
      instructionBuffer,
      instructionBufferLength
    );

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
    const { data } = createAccountWithSeedInstruction;
    const seedLength = data.length - defaultLength;
    const dataAllocator = Buffer.allocUnsafe(data.length - seedLength + 32);
    const dataPrefix = Buffer.from(data.slice(0, prefixLength));
    const seed = Buffer.from(data.slice(prefixLength, prefixLength + seedLength));
    const dataPostfix = Buffer.from(data.slice(prefixLength + seedLength, data.length));
    const paddingSeed = Buffer.alloc(32);
    seed.copy(paddingSeed, 32 - seed.length);
    dataPrefix.copy(dataAllocator, 0);
    paddingSeed.copy(dataAllocator, dataPrefix.length);
    dataPostfix.copy(dataAllocator, dataPrefix.length + paddingSeed.length);
    instructionBufferLength += dataAllocator.copy(instructionBuffer, instructionBufferLength);
    instructionBufferLength += getInstructionLayout(initializeInstruction).encode(
      initializeInstruction,
      instructionBuffer,
      instructionBufferLength
    );
    instructionBufferLength += getInstructionLayout(delegateInstruction).encode(
      delegateInstruction,
      instructionBuffer,
      instructionBufferLength
    );
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    const signDataLayout = BufferLayout.struct<
      Readonly<{
        keys: Uint8Array[];
        recentBlockhash: Uint8Array;
      }>
    >([BufferLayout.seq(publicKey('key'), this.accountKeys.length, 'keys'), publicKey('recentBlockhash')]);
    const transaction = {
      keys: this.accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }

  serializeStakingWithdraw(): string {
    const { keyCount, instructions } = this.encodedLength();
    const [instruction] = instructions;
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    const instructionLayout = BufferLayout.struct<
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
    const instructionBufferLength = instructionLayout.encode(instruction, instructionBuffer);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    let accountKeys;
    if (this.accountKeys.length === 5) {
      // Padding argument.
      accountKeys = [...this.accountKeys, Buffer.alloc(32).toString('hex')];
    } else {
      accountKeys = this.accountKeys;
    }
    const signDataLayout = BufferLayout.struct<
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
    const transaction = {
      keyCount: Buffer.from(keyCount),
      keys: accountKeys.map((key) => Buffer.from(key, 'hex')),
      recentBlockhash: Buffer.from(this.recentBlockhash, 'hex'),
    };
    const signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);

    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }
}

export default Message;
