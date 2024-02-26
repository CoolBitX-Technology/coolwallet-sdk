import * as BufferLayout from '@solana/buffer-layout';
import assert from './assert';
import { MessageV0 } from '../message';
export type TransactionVersion = 'legacy' | 0;
import * as shortvec from './shortvec-encoding';
import { SignatureLayout } from './commonLayout';

export class VersionedTransaction {
  signatures: Array<Uint8Array>;
  message: MessageV0;

  constructor(message: MessageV0, signatures: Array<Uint8Array>) {
    if (signatures === undefined) {
      throw new Error('Signatures are required');
    }
    assert(
      signatures.length === message.header.numRequiredSignatures,
      'Expected signatures length to be equal to the number of required signatures',
    );
    this.signatures = signatures;
    
    this.message = message;
  }

  serialize(): Uint8Array {
    const serializedMessage = this.message.serialize();

    const encodedSignaturesLength = Array<number>();
    shortvec.encodeLength(encodedSignaturesLength, this.signatures.length);

    const transactionLayout = BufferLayout.struct<{
      encodedSignaturesLength: Uint8Array;
      signatures: Array<Uint8Array>;
      serializedMessage: Uint8Array;
    }>([
      BufferLayout.blob(
        encodedSignaturesLength.length,
        'encodedSignaturesLength',
      ),
      BufferLayout.seq(
        SignatureLayout(),
        this.signatures.length,
        'signatures',
      ),
      BufferLayout.blob(serializedMessage.length, 'serializedMessage'),
    ]);

    const serializedTransaction = new Uint8Array(2048);
    const serializedTransactionLength = transactionLayout.encode(
      {
        encodedSignaturesLength: new Uint8Array(encodedSignaturesLength),
        signatures: this.signatures,
        serializedMessage,
      },
      serializedTransaction,
    );

    return serializedTransaction.slice(0, serializedTransactionLength);
  }
}
