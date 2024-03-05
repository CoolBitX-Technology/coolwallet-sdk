import * as BufferLayout from '@solana/buffer-layout';
import assert from './assert';
import { VersionedMessage } from '../message';
export type TransactionVersion = 'legacy' | 0;
import * as shortvec from './shortvec-encoding';
import { SignatureLayout } from './commonLayout';
import { SIGNATURE_LENGTH_IN_BYTES } from '../config/params';

export class VersionedTransaction {
  signatures: Array<Uint8Array>;
  message: VersionedMessage;

  constructor(message: VersionedMessage, signatures: Array<Uint8Array>) {
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

  static deserialize(serializedTransaction: Uint8Array): VersionedTransaction {
    const byteArray = [...serializedTransaction];

    const signatures = [];
    const signaturesLength = shortvec.decodeLength(byteArray);
    for (let i = 0; i < signaturesLength; i++) {
      signatures.push(
        new Uint8Array(byteArray.splice(0, SIGNATURE_LENGTH_IN_BYTES)),
      );
    }

    const message = VersionedMessage.deserialize(new Uint8Array(byteArray));
    return new VersionedTransaction(message, signatures);
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
