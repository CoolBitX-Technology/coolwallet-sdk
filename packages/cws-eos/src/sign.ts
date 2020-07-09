import { tx, transport } from '@coolwallet/core';
import crypto from 'crypto';
import BigInteger from 'bigi';
import base58 from 'bs58';

import { genSignBuf } from './eos_utils';

type Transport = transport.default;
type Transaction = import('./types').Transaction;
const elliptic = require('elliptic');

// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');

function ripemd160(data: Buffer): Buffer {
  return crypto
    .createHash('rmd160')
    .update(data)
    .digest();
}

function sha256(data: Buffer): Buffer {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest();
}

/**
 * @param {string} r
 * @param {string} s
 * @param {number} i
 * @return {String} EOS K1 Signature
 */
const combineSignature = (r: string, s: string, i: number) => {
  const buf = Buffer.alloc(65);
  buf.writeUInt8(i, 0);
  BigInteger.fromHex(r)
    .toBuffer(32)
    .copy(buf, 1);
  BigInteger.fromHex(s)
    .toBuffer(32)
    .copy(buf, 33);

  const keyType = 'K1';
  const check = [buf];
  check.push(Buffer.from(keyType));

  const checksum = ripemd160(Buffer.concat(check)).slice(0, 4);
  const encode = base58.encode(Buffer.concat([buf, checksum]));
  return `SIG_K1_${encode}`;
};

/**
 * decrypt dignature from cws, convert to EOS signature.
 */
const convertToSignature = (signature: any, signBuf: Buffer, publicKey: string) => {
  const ecQ = ec.keyFromPublic(publicKey, 'hex').pub;
  const i = ec.getKeyRecoveryParam(sha256(signBuf), signature, ecQ);
  return combineSignature(signature.r, signature.s, i + 31);
};

/**
 * sign EOS transfer (1 transfer action)
 */
export default async function signTransfer(
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  txObject: Transaction,
  addressIndex: number,
  chainId: string,
  publicKey: string,
  confirmCB: Function | undefined = undefined,
  authorizedCB: Function | undefined = undefined
) : Promise<string> {
  const keyId = tx.util.addressIndexToKeyId(coinType, addressIndex);
  const signBuf = genSignBuf(txObject, chainId);
  const dataForSE = tx.flow.prepareSEData(keyId, signBuf, 'f6');
  const canonicalSignature = await core.flow.getSingleSignatureFromCoolWallet(
    transport,
    appId,
    appPrivateKey,
    dataForSE,
    '00',
    false,
    undefined,
    confirmCB,
    authorizedCB,
    true
  );

  const signature = convertToSignature(canonicalSignature, signBuf, publicKey);
  return signature;
}
