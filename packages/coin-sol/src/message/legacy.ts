import * as BufferLayout from '@solana/buffer-layout';
import { encodeLength, numberToStringHex } from '../utils/stringUtil';
import { publicKey } from '../utils/commonLayout';
import { PACKET_DATA_SIZE, PADDING_PUBLICKEY, PUBLIC_KEY_LENGTH, VERSION_PREFIX_MASK } from '../config/params';
import { CompiledInstruction, CompliedInstruction, SerializedInstruction } from '../config/types';
import * as shortvec from '../utils/shortvec-encoding';
import {
  encodeAndPaddingSeedInstructionBuffer,
  encodeInstructionBuffer,
  encodeSignData,
  initAndPaddingComputeBudgetInstructionBuffer,
} from '../utils/bufferUtils';

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

export class Message {
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

  serializeHeader(): string {
    return (
      numberToStringHex(this.header.numRequiredSignatures, 2) +
      numberToStringHex(this.header.numReadonlySignedAccounts, 2) +
      numberToStringHex(this.header.numReadonlyUnsignedAccounts, 2)
    );
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

  serialize(): Buffer {
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

    // return signData.slice(0, length + instructionBuffer.length).toString('hex');
    return signData.slice(0, length + instructionBuffer.length);
  }

  serializeTransferMessage(): string {
    const { keyCount, instructions } = this.encodedLength();
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    let gasPrice;
    let gasLimit;
    let transfer;
    let instructionBufferLength = 0;
    if (instructions.length === 3) {
      [gasPrice, gasLimit, transfer] = instructions;
      const gasPriceLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(gasPrice.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), gasPrice.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(gasPrice.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), gasPrice.data.length, 'data'),
      ]);
      instructionBufferLength = gasPriceLayout.encode(gasPrice, instructionBuffer, 0);
      const gasLimitLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(gasLimit.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), gasLimit.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(gasLimit.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), gasLimit.data.length, 'data'),
      ]);
      instructionBufferLength += gasLimitLayout.encode(gasLimit, instructionBuffer, instructionBufferLength);
    } else {
      [transfer] = instructions;
    }

    const transferLayout = BufferLayout.struct<
      Readonly<{
        data: number[];
        dataLength: Uint8Array;
        programIdIndex: number;
        keyIndices: number[];
        keyIndicesCount: Uint8Array;
      }>
    >([
      BufferLayout.u8('programIdIndex'),
      BufferLayout.blob(transfer.keyIndicesCount.length, 'keyIndicesCount'),
      BufferLayout.seq(BufferLayout.u8('keyIndex'), transfer.keyIndices.length, 'keyIndices'),
      BufferLayout.blob(transfer.dataLength.length, 'dataLength'),
      BufferLayout.seq(BufferLayout.u8('userdatum'), transfer.data.length, 'data'),
    ]);

    instructionBufferLength += transferLayout.encode(transfer, instructionBuffer, instructionBufferLength);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    let accountKeys = [...this.accountKeys];
    for (let i = this.accountKeys.length; i < 6; i++) {
      accountKeys = accountKeys.concat(PADDING_PUBLICKEY);
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

  serializeCreateAndTransferSPLToken(): string {
    const { keyCount, instructions } = this.encodedLength();
    let instructionBuffer = Buffer.alloc(PACKET_DATA_SIZE);
    let associateAccount;
    let gasPrice;
    let gasLimit;
    let tokenTransfer;
    let instructionBufferLength = 0;
    if (instructions.length === 4) {
      [associateAccount, gasPrice, gasLimit, tokenTransfer] = instructions;

      const associateAccountLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(associateAccount.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), associateAccount.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(associateAccount.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), associateAccount.data.length, 'data'),
      ]);
      instructionBufferLength = associateAccountLayout.encode(associateAccount, instructionBuffer, 0);

      const gasPriceLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(gasPrice.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), gasPrice.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(gasPrice.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), gasPrice.data.length, 'data'),
      ]);
      instructionBufferLength += gasPriceLayout.encode(gasPrice, instructionBuffer, instructionBufferLength);

      const gasLimitLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(gasLimit.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), gasLimit.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(gasLimit.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), gasLimit.data.length, 'data'),
      ]);
      instructionBufferLength += gasLimitLayout.encode(gasLimit, instructionBuffer, instructionBufferLength);
    } else {
      [associateAccount, tokenTransfer] = instructions;
      const associateAccountLayout = BufferLayout.struct<
        Readonly<{
          data: number[];
          dataLength: Uint8Array;
          programIdIndex: number;
          keyIndices: number[];
          keyIndicesCount: Uint8Array;
        }>
      >([
        BufferLayout.u8('programIdIndex'),
        BufferLayout.blob(associateAccount.keyIndicesCount.length, 'keyIndicesCount'),
        BufferLayout.seq(BufferLayout.u8('keyIndex'), associateAccount.keyIndices.length, 'keyIndices'),
        BufferLayout.blob(associateAccount.dataLength.length, 'dataLength'),
        BufferLayout.seq(BufferLayout.u8('userdatum'), associateAccount.data.length, 'data'),
      ]);
      instructionBufferLength = associateAccountLayout.encode(associateAccount, instructionBuffer, 0);
    }
    const tokenTransferLayout = BufferLayout.struct<
      Readonly<{
        programIdIndex: number;
        keyIndices: number[];
        keyIndicesCount: Uint8Array;
        data: number[];
        dataLength: Uint8Array;
      }>
    >([
      BufferLayout.u8('programIdIndex'),
      BufferLayout.blob(tokenTransfer.keyIndicesCount.length, 'keyIndicesCount'),
      BufferLayout.seq(BufferLayout.u8('keyIndex'), tokenTransfer.keyIndices.length, 'keyIndices'),
      BufferLayout.blob(tokenTransfer.dataLength.length, 'dataLength'),
      BufferLayout.seq(BufferLayout.u8('userdatum'), tokenTransfer.data.length, 'data'),
    ]);
    instructionBufferLength += tokenTransferLayout.encode(tokenTransfer, instructionBuffer, instructionBufferLength);
    instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
    let accountKeys = [...this.accountKeys];
    for (let i = this.accountKeys.length; i < 9; i++) {
      accountKeys = accountKeys.concat(Buffer.alloc(32).toString('hex'));
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

  reservePaddingAccountKeys(maxAccountKeyLength: number): string[] {
    const accountKeys = this.accountKeys;
    const needPaddingKeyLength = maxAccountKeyLength - this.accountKeys.length;
    for (let i = 0; i < needPaddingKeyLength; i++) {
      accountKeys.push(PADDING_PUBLICKEY);
    }
    return accountKeys;
  }

  serializeDelegateAndCreateAccountWithSeed(): string {
    const { keyCount, instructionCount, instructions } = this.encodedLength();
    const initAndPaddingInstruction = initAndPaddingComputeBudgetInstructionBuffer(this.accountKeys, instructionCount);
    const instructionBuffer = encodeAndPaddingSeedInstructionBuffer(
      this.accountKeys,
      instructions,
      initAndPaddingInstruction.instructionBuffer,
      initAndPaddingInstruction.instructionBufferLength
    );
    /**
     * signerPubkey
     * stakeAccountPubkey
     * 11111111111111111111111111111111
     * validatorPubkey
     * Stake11111111111111111111111111111111111111
     * StakeConfig11111111111111111111111111111111
     * SysvarC1ock11111111111111111111111111111111
     * SysvarRent111111111111111111111111111111111
     * SysvarStakeHistory1111111111111111111111111
     * ComputeBudget111111111111111111111111111111  (optional)
     */
    const newAccountKeys = this.reservePaddingAccountKeys(10);
    return encodeSignData(keyCount, newAccountKeys, this.recentBlockhash, instructionBuffer).toString('hex');
  }

  serializeUndelegate(): string {
    const { keyCount, instructionCount, instructions } = this.encodedLength();
    const initAndPaddingInstruction = initAndPaddingComputeBudgetInstructionBuffer(this.accountKeys, instructionCount);
    const instructionBuffer = encodeInstructionBuffer(
      instructions,
      initAndPaddingInstruction.instructionBuffer,
      initAndPaddingInstruction.instructionBufferLength
    );
    /**
     * signerPubkey
     * stakeAccountPubkey
     * Stake11111111111111111111111111111111111111
     * SysvarC1ock11111111111111111111111111111111
     * ComputeBudget111111111111111111111111111111  (optional)
     */
    const newAccountKeys = this.reservePaddingAccountKeys(5);
    return encodeSignData(keyCount, newAccountKeys, this.recentBlockhash, instructionBuffer).toString('hex');
  }

  serializeWithdraw(): string {
    const { keyCount, instructionCount, instructions } = this.encodedLength();
    const initAndPaddingInstruction = initAndPaddingComputeBudgetInstructionBuffer(this.accountKeys, instructionCount);
    const instructionBuffer = encodeInstructionBuffer(
      instructions,
      initAndPaddingInstruction.instructionBuffer,
      initAndPaddingInstruction.instructionBufferLength
    );
    /**
     * signerPubkey
     * stakeAccountPubkey
     * withdrawToPubkey                            (optional)
     * Stake11111111111111111111111111111111111111
     * SysvarC1ock11111111111111111111111111111111
     * SysvarStakeHistory1111111111111111111111111
     * ComputeBudget111111111111111111111111111111 (optional)
     */
    const newAccountKeys = this.reservePaddingAccountKeys(7);
    return encodeSignData(keyCount, newAccountKeys, this.recentBlockhash, instructionBuffer).toString('hex');
  }

  /**
   * Decode a compiled message into a Message object.
   */
  static from(buffer: Buffer | Uint8Array | Array<number>): Message {
    // Slice up wire data
    let byteArray = [...buffer];

    const numRequiredSignatures = byteArray.shift()!;
    if (numRequiredSignatures !== (numRequiredSignatures & VERSION_PREFIX_MASK)) {
      throw new Error('Versioned messages must be deserialized with VersionedMessage.deserialize()');
    }

    const numReadonlySignedAccounts = byteArray.shift()!;
    const numReadonlyUnsignedAccounts = byteArray.shift()!;

    const accountCount = shortvec.decodeLength(byteArray);
    const accountKeys = [];
    for (let i = 0; i < accountCount; i++) {
      const account = byteArray.slice(0, PUBLIC_KEY_LENGTH);
      byteArray = byteArray.slice(PUBLIC_KEY_LENGTH);
      accountKeys.push(Buffer.from(account).toString('hex'));
    }

    const recentBlockhash = byteArray.slice(0, PUBLIC_KEY_LENGTH);
    byteArray = byteArray.slice(PUBLIC_KEY_LENGTH);

    const instructionCount = shortvec.decodeLength(byteArray);
    const instructions: CompiledInstruction[] = [];
    for (let i = 0; i < instructionCount; i++) {
      const programIdIndex = byteArray.shift()!;
      const instructionAccountCount = shortvec.decodeLength(byteArray);
      const accounts = byteArray.slice(0, instructionAccountCount);
      byteArray = byteArray.slice(instructionAccountCount);
      const dataLength = shortvec.decodeLength(byteArray);
      const dataSlice = byteArray.slice(0, dataLength);
      const data = Buffer.from(dataSlice).toString('hex');
      byteArray = byteArray.slice(dataLength);
      instructions.push({
        programIdIndex,
        accounts,
        data,
      });
    }

    const messageArgs = {
      header: {
        numRequiredSignatures,
        numReadonlySignedAccounts,
        numReadonlyUnsignedAccounts,
      },
      recentBlockhash: Buffer.from(recentBlockhash).toString('hex'),
      accountKeys,
      instructions,
    };

    return new Message(messageArgs);
  }
}
