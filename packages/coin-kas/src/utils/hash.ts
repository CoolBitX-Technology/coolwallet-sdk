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
import { TransactionInput, TransactionOutput, TransactionSigningHashKey, TransactionUtxo } from '../config/types';
import { Transaction } from '../transaction';
import { HashWriter } from '../transaction/HashWriter';
import { fromHex } from './utils';
import { COIN_TYPE } from '../config/param';
import { getPath } from '@coolwallet/core/lib/utils';
import { PathType } from '@coolwallet/core/lib/config';

/* eslint-disable no-bitwise */
export const SIGHASH_ALL = 0b00000001;
export const SIGHASH_NONE = 0b00000010;
export const SIGHASH_SINGLE = 0b00000100;
export const SIGHASH_ANYONECANPAY = 0b10000000;
export const SIGHASH_MASK = 0b00000111;

export const HASH_BLAKE_2B_256_WITH_KEY = 0x13;

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
  hashWriter.writeHash(fromHex(input.previousOutpoint.transactionId), 'previousOutpoint.transactionId');
  hashWriter.writeUInt32LE(input.previousOutpoint.index, 'reversePreviousOutpoint.index');
}

function hashTxOut(hashWriter: HashWriter, output: TransactionOutput): void {
  hashWriter.writeUInt64LE(new BigNumber(output.amount), 'outputReverseAmount');
  const { version, scriptPublicKey } = output.scriptPublicKey;
  hashWriter.writeUInt16LE(version, 'outputReverseScriptVersion');
  hashWriter.writeVarBytes(fromHex(scriptPublicKey), 'outputScriptPublicKey');
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

function getOutputsTotalLength(outputs: TransactionOutput[]) {
  return outputs.reduce((acc, { scriptPublicKey }) => {
    // 8 (outputAmount) + 8 (scriptPublicKeyLength) + 2 (version) + scriptPublicKey
    return acc + 18 + scriptPublicKey.scriptPublicKey.length / 2;
  }, 0);
}

export function calculateSigHash(
  transaction: Transaction,
  signHashType: number,
  inputIndex: number,
  reusedValues = {}
): Buffer {
  const hashWriter = new HashWriter();

  hashWriter.writeUInt16LE(transaction.version, 'reverseTransactionVersion');
  hashWriter.writeHash(getPreviousOutputsHash(transaction, signHashType, reusedValues), 'previousOutputsHash');
  hashWriter.writeHash(getSequencesHash(transaction, signHashType, reusedValues), 'sequencesOutputsHash');
  hashWriter.writeHash(getSigOpCountsHash(transaction, signHashType, reusedValues), 'sigOpCountsHash');

  const input = transaction.inputs[inputIndex];
  const utxo = transaction.utxos[inputIndex];
  hashOutpoint(hashWriter, input);
  hashWriter.writeUInt16LE(0, 'outputReverseScriptVersion'); // TODO: USE REAL SCRIPT VERSION
  hashWriter.writeVarBytes(utxo.pkScript, 'inputScriptPublicKey');
  hashWriter.writeUInt64LE(new BigNumber(utxo.amount), 'inputReverseAmount');
  hashWriter.writeUInt64LE(new BigNumber(input.sequence), 'inputReverseSequence');
  hashWriter.writeUInt8(1, 'sigOpCount');

  hashWriter.writeHash(getOutputsHash(transaction, inputIndex, signHashType, reusedValues), 'outputsHash');
  hashWriter.writeUInt64LE(new BigNumber(transaction.lockTime), 'reverseLockTime');
  hashWriter.writeHash(zeroSubnetworkID(), 'subNetworkId'); // TODO: USE REAL SUBNETWORK ID
  hashWriter.writeUInt64LE(new BigNumber(0), 'reverseGas'); // TODO: USE REAL GAS
  hashWriter.writeHash(zeroHash(), 'payload'); // TODO: USE REAL PAYLOAD HASH
  hashWriter.writeUInt8(signHashType, 'signHashType');
  return hashWriter.finalize();
}

export async function getTransferArgumentBuffer(transaction: Transaction): Promise<Buffer> {
  const signHashType = SIGHASH_ALL;
  const hashType = HASH_BLAKE_2B_256_WITH_KEY;
  const output = transaction.outputs[0];
  const change = transaction.outputs?.[1];
  const hashWriter = new HashWriter();
  hashWriter.writeUInt16LE(transaction.version, 'reverseTransactionVersion');
  hashWriter.writeHash(getPreviousOutputsHash(transaction, signHashType, {}), 'previousOutputsHash');
  hashWriter.writeHash(getSequencesHash(transaction, signHashType, {}), 'sequencesHash');
  hashWriter.writeHash(getSigOpCountsHash(transaction, signHashType, {}), 'sigOpCountsHash');
  hashWriter.writeUInt32BE(0, 'zeroPadding');
  hashWriter.writeUInt8(hashType, 'hasType');

  // output
  hashWriter.writeUInt16BE(getOutputsTotalLength(transaction.outputs), 'outputTotalLength');
  /**
   * The format of publicKeyOrScriptHash is as follows:
   *
   * 1. X Only Public Key with padding:
   *    Format: 00 + 32 bytes x-only public key, script type 00
   *    Example: 00da8eaa97bf4457368188c78e92661fdf2d96ce166b225d0dc6c1c3e322ef62ef
   *
   * 2. Public Key:
   *    Format: 33 bytes public key, script type 01
   *    Example: 03b1b89146cea93cf8bec6fa3d4d79c26586ac09a1e8ebf37aa5904629f63c857d
   *
   * 3. Script Hash with padding:
   *    Format: 00 + 32 bytes script hash, script type 02
   *    Example: 00b815f3841cfb87b8fd834b2c1cba9a8790fb5f568cc7b3a377acd71350d08691
   *
   * Note: All formats are padded to 33 bytes length for consistency
   */
  const { scriptType, version, scriptPublicKey, publicKeyOrScriptHash } = output.scriptPublicKey;
  hashWriter.writeUInt8(scriptType, 'outputScriptType');
  hashWriter.write(fromHex(publicKeyOrScriptHash.padStart(33 * 2, '0')), 'outputScriptPublicKey');
  hashWriter.writeUInt64LE(new BigNumber(output.amount), 'outputReverseAmount');
  hashWriter.writeUInt16LE(version, 'outputReverseScriptVersion');
  hashWriter.writeUInt64LE(new BigNumber(fromHex(scriptPublicKey).length), 'outputReverseScriptPublicKeyLength');

  // change
  const haveChange = change ? 1 : 0;
  hashWriter.writeUInt8(haveChange, 'haveChange');
  hashWriter.writeUInt64LE(change ? new BigNumber(change.amount) : new BigNumber(0), 'changeReverseAmount');
  hashWriter.writeUInt16BE(TransactionSigningHashKey.length, 'keyLength');
  hashWriter.write(TransactionSigningHashKey, 'hashKey');
  if (haveChange && change?.addressIndex !== undefined) {
    const sePath = await getPath(COIN_TYPE, change.addressIndex, 5, PathType.BIP32);
    hashWriter.write(Buffer.from(sePath, 'hex'), 'sePath');
  } else {
    hashWriter.write(Buffer.alloc(21), 'sePath');
  }

  hashWriter.writeUInt64LE(new BigNumber(transaction.lockTime), 'reverseLockTime');
  hashWriter.writeHash(zeroSubnetworkID(), 'subNetworkId'); // TODO: USE REAL SUBNETWORK ID
  hashWriter.writeUInt64LE(new BigNumber(0), 'reverseGas'); // TODO: USE REAL GAS
  hashWriter.writeHash(zeroHash(), 'payload'); // TODO: USE REAL PAYLOAD HASH
  hashWriter.writeUInt8(signHashType, 'signHashType');
  return hashWriter.toBuffer();
}

export async function getUtxoArgumentBuffer(input: TransactionInput, utxo: TransactionUtxo): Promise<Buffer> {
  const hashWriter = new HashWriter();
  const sePath = await getPath(COIN_TYPE, input.addressIndex, 5, PathType.BIP32);
  hashWriter.writeUInt8(21, 'pathLength');
  hashWriter.write(Buffer.from(sePath, 'hex'), 'sePath');
  hashOutpoint(hashWriter, input);
  hashWriter.writeUInt16LE(0, 'inputReverseScriptVersion'); // TODO: USE REAL SCRIPT VERSION
  hashWriter.writeVarBytes(utxo.pkScript, 'inputScriptPublicKey');
  hashWriter.writeUInt64LE(new BigNumber(utxo.amount), 'inputReverseAmount');
  hashWriter.writeUInt64LE(new BigNumber(input.sequence), 'inputReverseSequence');
  hashWriter.writeUInt8(1, 'inputSigOpCount');
  return hashWriter.toBuffer();
}
