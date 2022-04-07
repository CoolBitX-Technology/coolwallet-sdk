import { PACKET_DATA_SIZE } from '../config/params';
import { CompliedInstruction } from '../config/types';
import { encodeLength } from './stringUtil';
import * as BufferLayout from '@solana/buffer-layout';

type MessageHeader = {
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
  numUnRequiredAccounts: number;
};

type MessageArgs = {
  header: MessageHeader;
  accountKeys: string[];
  recentBlockhash: string;
  instructions: CompliedInstruction[];
};

const publicKey = (property: string = 'publicKey') => {
  return BufferLayout.blob(32, property);
};

export default class Message {
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

  serialize(isPartialSerialize = true): string {
    // encode key count
    const numKeys = this.accountKeys.length;
    const numUnRequireKeys = numKeys - this.header.numUnRequiredAccounts;
    let keyCount: number[] = [];
    encodeLength(keyCount, numUnRequireKeys);

    // extract input instructions to serialize instructions
    const instructions = this.instructions.map((instruction) => {
      const { accounts, programIdIndex } = instruction;
      const data = Array.from(Buffer.from(instruction.data, 'hex'));

      let keyIndicesCount: number[] = [];
      encodeLength(keyIndicesCount, accounts.length);

      let dataCount: number[] = [];
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
    let instructionCount: number[] = [];
    encodeLength(instructionCount, instructions.length);

    // encode instruction
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    if (!isPartialSerialize) Buffer.from(instructionCount).copy(instructionBuffer);
    let instructionBufferLength = isPartialSerialize ? 0 : instructionCount.length;

    instructions.forEach((instruction) => {
      const instructionLayout = isPartialSerialize
        ? BufferLayout.struct<
            Readonly<{
              data: number[];
              dataLength: Uint8Array;
            }>
          >([
            BufferLayout.blob(instruction.dataLength.length, 'dataLength'),
            BufferLayout.seq(BufferLayout.u8('userdatum'), instruction.data.length, 'data'),
          ])
        : BufferLayout.struct<
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
    const signDataLayout = isPartialSerialize
      ? BufferLayout.struct<
          Readonly<{
            keyCount: Uint8Array;
            keys: Uint8Array[];
            recentBlockhash: Uint8Array;
          }>
        >([
          BufferLayout.blob(keyCount.length, 'keyCount'),
          BufferLayout.seq(publicKey('key'), numKeys, 'keys'),
          publicKey('recentBlockhash'),
        ])
      : BufferLayout.struct<
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
          BufferLayout.seq(publicKey('key'), numKeys, 'keys'),
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
    let signData = Buffer.alloc(2048); // sign data max length
    const length = signDataLayout.encode(transaction, signData);
    instructionBuffer.copy(signData, length);

    return signData.slice(0, length + instructionBuffer.length).toString('hex');
  }
}
