/*
MIT License

Copyright (c) 2023 OKX.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Modified by coolbitx in 2024

import BigNumber from 'bignumber.js';
import { TransactionInput, TransactionOutput, TransactionUtxo } from '../config/types';
import { Transaction } from '../transaction';
import { HashWriter } from '../transaction/HashWriter';
import { fromHex } from './utils';
import { COIN_TYPE } from '../config/param';
import { getPath } from '@coolwallet/core/lib/utils';

/* eslint-disable no-bitwise */
export const SIGHASH_ALL = 0b00000001;
export const SIGHASH_NONE = 0b00000010;
export const SIGHASH_SINGLE = 0b00000100;
export const SIGHASH_ANYONECANPAY = 0b10000000;
export const SIGHASH_MASK = 0b00000111;

function isSigHashNone(hashType: number): boolean {
  return (hashType & SIGHASH_MASK) === SIGHASH_NONE;
}

function isSigHashSingle(hashType: number): boolean {
  return (hashType & SIGHASH_MASK) === SIGHASH_SINGLE;
}

function isSigHashAnyoneCanPay(hashType: number): boolean {
  return (hashType & SIGHASH_ANYONECANPAY) === SIGHASH_ANYONECANPAY;
}

function zeroHash(): Buffer {
  return Buffer.alloc(32);
}

function zeroSubnetworkID(): Buffer {
  return Buffer.alloc(20);
}

function hashOutpoint(hashWriter: HashWriter, input: TransactionInput): void {
  hashWriter.writeHash(fromHex(input.previousOutpoint.transactionId));
  hashWriter.writeUInt32LE(input.previousOutpoint.index);
}

function hashTxOut(hashWriter: HashWriter, output: TransactionOutput): void {
  hashWriter.writeUInt64LE(new BigNumber(output.amount));
  hashWriter.writeUInt16LE(0); // TODO: USE REAL SCRIPT VERSION
  hashWriter.writeVarBytes(fromHex(output.scriptPublicKey.scriptPublicKey));
}

interface ReusedValues {
  previousOutputsHash?: Buffer;
  sequencesHash?: Buffer;
  sigOpCountsHash?: Buffer;
  outputsHash?: Buffer;
}
function getPreviousOutputsHash(transaction: Transaction, hashType: number, reusedValues: ReusedValues): Buffer {
  if (isSigHashAnyoneCanPay(hashType)) {
    return zeroHash();
  }

  if (!reusedValues.previousOutputsHash) {
    const hashWriter = new HashWriter();
    transaction.inputs.forEach((input) => hashOutpoint(hashWriter, input));
    reusedValues.previousOutputsHash = hashWriter.finalize();
  }

  return reusedValues.previousOutputsHash;
}

function getSequencesHash(transaction: Transaction, hashType: number, reusedValues: ReusedValues): Buffer {
  if (isSigHashSingle(hashType) || isSigHashAnyoneCanPay(hashType) || isSigHashNone(hashType)) {
    return zeroHash();
  }

  if (!reusedValues.sequencesHash) {
    const hashWriter = new HashWriter();
    transaction.inputs.forEach((input) => hashWriter.writeUInt64LE(new BigNumber(input.sequence)));
    reusedValues.sequencesHash = hashWriter.finalize();
  }

  return reusedValues.sequencesHash;
}

function getSigOpCountsHash(transaction: Transaction, hashType: number, reusedValues: ReusedValues): Buffer {
  if (isSigHashAnyoneCanPay(hashType)) {
    return zeroHash();
  }

  if (!reusedValues.sigOpCountsHash) {
    const hashWriter = new HashWriter();
    transaction.inputs.forEach(() => hashWriter.writeUInt8(1));
    reusedValues.sigOpCountsHash = hashWriter.finalize();
  }

  return reusedValues.sigOpCountsHash;
}

function getOutputsHash(
  transaction: Transaction,
  inputIndex: number,
  hashType: number,
  reusedValues: ReusedValues
): Buffer {
  if (isSigHashNone(hashType)) {
    return zeroHash();
  }

  // SigHashSingle: If the relevant output exists - return its hash, otherwise return zero-hash
  if (isSigHashSingle(hashType)) {
    if (inputIndex >= transaction.outputs.length) {
      return zeroHash();
    }

    const hashWriter = new HashWriter();
    return hashWriter.finalize();
  }

  if (!reusedValues.outputsHash) {
    const hashWriter = new HashWriter();
    transaction.outputs.forEach((output: TransactionOutput) => hashTxOut(hashWriter, output));
    reusedValues.outputsHash = hashWriter.finalize();
  }

  return reusedValues.outputsHash;
}

export function calculateSigHash(
  transaction: Transaction,
  hashType: number,
  inputIndex: number,
  reusedValues = {}
): Buffer {
  const hashWriter = new HashWriter();

  hashWriter.writeUInt16LE(transaction.version);
  hashWriter.writeHash(getPreviousOutputsHash(transaction, hashType, reusedValues));
  hashWriter.writeHash(getSequencesHash(transaction, hashType, reusedValues));
  hashWriter.writeHash(getSigOpCountsHash(transaction, hashType, reusedValues));

  const input = transaction.inputs[inputIndex];
  const utxo = transaction.utxos[inputIndex];
  hashOutpoint(hashWriter, input);
  hashWriter.writeUInt16LE(0); // TODO: USE REAL SCRIPT VERSION
  hashWriter.writeVarBytes(utxo.pkScript);
  hashWriter.writeUInt64LE(new BigNumber(utxo.amount));
  hashWriter.writeUInt64LE(new BigNumber(input.sequence));
  hashWriter.writeUInt8(1); // sigOpCount

  hashWriter.writeHash(getOutputsHash(transaction, inputIndex, hashType, reusedValues));
  hashWriter.writeUInt64LE(new BigNumber(transaction.lockTime));
  hashWriter.writeHash(zeroSubnetworkID()); // TODO: USE REAL SUBNETWORK ID
  hashWriter.writeUInt64LE(new BigNumber(0)); // TODO: USE REAL GAS
  hashWriter.writeHash(zeroHash()); // TODO: USE REAL PAYLOAD HASH
  hashWriter.writeUInt8(hashType);

  return hashWriter.finalize();
}

export async function getTransferArgumentBuffer(transaction: Transaction): Promise<Buffer> {
  const hashType = SIGHASH_ALL;
  const output = transaction.outputs[0];
  const change = transaction.outputs?.[1];
  const hashWriter = new HashWriter();
  // transaction version
  hashWriter.writeUInt16LE(transaction.version);
  // previous outpoint hash
  hashWriter.writeHash(getPreviousOutputsHash(transaction, hashType, {}));
  // sequences hash
  hashWriter.writeHash(getSequencesHash(transaction, hashType, {}));
  // input sigOp counts hash
  hashWriter.writeHash(getSigOpCountsHash(transaction, hashType, {}));
  // output amount + version + key length + script public key
  hashTxOut(hashWriter, output);
  // have change
  hashWriter.writeUInt8(change ? 1 : 0);
  // change amount
  hashWriter.writeUInt64LE(change ? new BigNumber(change.amount) : new BigNumber(0));
  // se path
  if (change.addressIndex !== undefined) {
    const sePath = await getPath(COIN_TYPE, change.addressIndex);
    hashWriter.write(Buffer.from(sePath, 'hex'));
  } else {
    hashWriter.write(Buffer.alloc(21));
  }
  // lock time
  hashWriter.writeUInt64LE(new BigNumber(transaction.lockTime));
  // sub network id
  hashWriter.writeHash(zeroSubnetworkID()); // TODO: USE REAL SUBNETWORK ID
  // empty gas
  hashWriter.writeUInt64LE(new BigNumber(0)); // TODO: USE REAL GAS
  // empty payload
  hashWriter.writeHash(zeroHash()); // TODO: USE REAL PAYLOAD HASH
  // hash type
  hashWriter.writeUInt8(hashType);
  return hashWriter.toBuffer();
}

export async function getUtxoArgumentBuffer(
  input: TransactionInput,
  utxo: TransactionUtxo
): Promise<Buffer> {
  const hashWriter = new HashWriter();
  // se path
  const sePath = await getPath(COIN_TYPE, input.addressIndex);
  hashWriter.write(Buffer.from(sePath, 'hex'));
  // input outPoint
  hashOutpoint(hashWriter, input);
  // input script version
  hashWriter.writeUInt16LE(0); // TODO: USE REAL SCRIPT VERSION
  // input script
  hashWriter.writeVarBytes(utxo.pkScript);
  // input amount
  hashWriter.writeUInt64LE(new BigNumber(utxo.amount));
  // input sequence
  hashWriter.writeUInt64LE(new BigNumber(input.sequence));
  // input sigOpCount
  hashWriter.writeUInt8(1);
  return hashWriter.toBuffer();
}
