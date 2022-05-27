const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak');
const pbEncoder = require('protocol-buffers-encodings');

import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import { bech32 } from 'bech32';
import * as params from '../config/params';
import { TxTypes } from '../config/types';
import type {
  Integer,
  Options,
  Transaction,
  Transfer,
  Execution,
  XRC20Token,
  StakeCreate,
  StakeUnstake,
  StakeWithdraw,
  StakeDeposit,
} from '../config/types';

export function pubKeyToAddress(compressedPubkey: string): string {
  const uncompressedKey = ec.keyFromPublic(compressedPubkey, 'hex').getPublic(false, 'hex');
  const keyBuffer = Buffer.from(uncompressedKey.substr(2), 'hex');
  const keyHash = createKeccakHash('keccak256').update(keyBuffer).digest('hex');
  const data = keyHash.substr(-40);
  const prefix = 'io';
  const dataBuf = Buffer.from(data, 'hex');
  const words = bech32.toWords(dataBuf);
  const address = bech32.encode(prefix, words, 100);
  return address;
}

export function getScript(txType: TxTypes) {
  let param;
  if (txType === TxTypes.Transfer) param = params.Transfer;
  if (txType === TxTypes.Execution) param = params.Execution;
  if (txType === TxTypes.XRC20Token) param = params.XRC20Token;
  if (txType === TxTypes.StakeCreate) param = params.StakeCreate;
  if (txType === TxTypes.StakeUnstake) param = params.StakeUnstake;
  if (txType === TxTypes.StakeWithdraw) param = params.StakeWithdraw;
  if (txType === TxTypes.StakeDeposit) param = params.StakeDeposit;
  if (!param) throw new Error('txType is invalid');
  return param.script + param.signature.padStart(144, '0');
}

const re = /^([0-9A-Fa-f]{2})+$/;
const checkHexChar = (hex: string) => {
  if (hex === '' || re.test(hex)) return hex;
  throw new Error('invalid hex string');
};
const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
const handleHex = (hex: string) => checkHexChar(evenHexDigit(removeHex0x(hex)));
const bnToHex = (bn: BigNumber, padBytes = 0) => {
  const hex = bn.toString(16);
  if (typeof padBytes === 'number' && padBytes > 0) {
    if (padBytes * 2 < hex.length) throw new Error('argument is overlong!');
    return hex.padStart(padBytes * 2, '0');
  }
  if (hex === '0') return '';
  return handleHex(hex);
};
const intToHex = (i: Integer, padBytes = 0) => bnToHex(new BigNumber(i), padBytes);
const intToNum = (i: Integer) => new BigNumber(i).toNumber();
const intToStr = (i: Integer) => new BigNumber(i).toFixed();
const decodeAddr = (a: string) => {
  const decoded = bech32.decode(a, 50);
  const recovered = bech32.fromWords(decoded.words);
  return handleHex(Buffer.from(recovered).toString('hex'));
};

export function getArguments(tx: Transaction, txType: TxTypes) {
  const { addressIndex, nonce, gasLimit, gasPrice } = tx;
  const fullPath = utils.getFullPath({
    pathType: config.PathType.BIP32,
    pathString: `44'/304'/0'/0/${addressIndex}`,
  });
  let result = `15${fullPath}`; // length: 22 bytes
  result += intToHex(nonce, 8);
  result += intToHex(gasLimit, 8);
  result += intToHex(gasPrice, 12);
  switch (txType) {
    case TxTypes.Transfer: {
      const { amount, recipient, payload = '' } = tx as Transfer;
      if (recipient.length != 41) throw new Error('address length invalid');
      result += intToHex(amount, 12);
      result += Buffer.from(recipient).toString('hex');
      const payloadHex = handleHex(payload);
      result += payloadHex === '' ? '00' : '01' + payloadHex;
      break;
    }
    case TxTypes.Execution: {
      const { amount, contract, data = '' } = tx as Execution;
      if (contract.length != 41) throw new Error('address length invalid');
      result += intToHex(amount, 12);
      result += Buffer.from(contract).toString('hex');
      const dataHex = handleHex(data);
      result += dataHex === '' ? '00' : '01' + dataHex;
      break;
    }
    case TxTypes.XRC20Token: {
      const { amount, recipient, tokenDecimals, tokenSymbol, tokenAddress, tokenSignature } = tx as XRC20Token;
      if (recipient.length != 41) throw new Error('recipient length invalid');
      if (tokenAddress.length != 41) throw new Error('tokenAddress length invalid');
      if (tokenSignature && tokenSignature.length != 72) throw new Error('tokenSignature length invalid');
      result += intToHex(amount, 12);
      result += decodeAddr(recipient);
      result += intToHex(tokenDecimals, 1);
      result += intToHex(tokenSymbol.length, 1);
      result += Buffer.from(tokenSymbol).toString('hex').padEnd(14, '0');
      result += Buffer.from(tokenAddress).toString('hex');
      console.log('result :', result);
      if (tokenSignature) result += handleHex(tokenSignature);
      break;
    }
    case TxTypes.StakeCreate: {
      const { candidateName, amount, duration, isAuto, payload = '' } = tx as StakeCreate;
      if (!candidateName) throw new Error('candidate name is required');
      result += Buffer.from(candidateName).toString('hex').padStart(40, '0');
      result += intToHex(amount, 12);
      result += intToHex(duration, 8);
      result += isAuto ? '01' : '00';
      const payloadHex = handleHex(payload);
      result += payloadHex === '' ? '00' : '01' + payloadHex;
      break;
    }
    case TxTypes.StakeUnstake: {
      const { bucketIndex, payload = '' } = tx as StakeUnstake;
      result += intToHex(bucketIndex, 8);
      const payloadHex = handleHex(payload);
      result += payloadHex === '' ? '00' : '01' + payloadHex;
      break;
    }
    case TxTypes.StakeWithdraw: {
      const { bucketIndex, payload = '' } = tx as StakeWithdraw;
      result += intToHex(bucketIndex, 8);
      const payloadHex = handleHex(payload);
      result += payloadHex === '' ? '00' : '01' + payloadHex;
      break;
    }
    case TxTypes.StakeDeposit: {
      const { bucketIndex, amount, payload = '' } = tx as StakeDeposit;
      result += intToHex(bucketIndex, 8);
      result += intToHex(amount, 12);
      const payloadHex = handleHex(payload);
      result += payloadHex === '' ? '00' : '01' + payloadHex;
      break;
    }
    default:
      throw new Error('txType is invalid');
  }
  return result;
}

function boolEncode(value: boolean) {
  const len = pbEncoder.bool.encodingLength(value);
  const buf = Buffer.alloc(len);
  return pbEncoder.bool.encode(value, buf, 0);
}

function varintEncode(value: Integer) {
  const len = pbEncoder.uint64.encodingLength(value);
  const buf = Buffer.alloc(len);
  return pbEncoder.uint64.encode(value, buf, 0);
}

function stringEncode(value: string) {
  const len = pbEncoder.string.encodingLength(value);
  const buf = Buffer.alloc(len);
  return pbEncoder.string.encode(value, buf, 0);
}

function bytesEncode(value: Buffer) {
  const len = pbEncoder.bytes.encodingLength(value);
  const buf = Buffer.alloc(len);
  return pbEncoder.bytes.encode(value, buf, 0);
}

function encodeTx(tx: any) {
  const bufferList = [];
  for (const { prefix, value, array } of tx) {
    let buf;
    if (array) {
      if (array.length === 0) continue;
      buf = bytesEncode(encodeTx(array));
    } else if (typeof value === 'boolean') {
      if (value === false) continue;
      buf = boolEncode(value);
    } else if (typeof value === 'number') {
      if (value === 0) continue;
      buf = varintEncode(value);
    } else if (typeof value === 'string') {
      if (value === '') continue;
      buf = stringEncode(value);
    } else {
      if (value.length === 0) continue;
      buf = bytesEncode(value);
    }
    bufferList.push(Buffer.from(prefix, 'hex'));
    bufferList.push(buf);
  }
  return Buffer.concat(bufferList);
}

export function encodeXRC20TokenInfo(recipient: string, amount: Integer): Buffer {
  const data = 'a9059cbb000000000000000000000000' + decodeAddr(recipient)
    + '0000000000000000000000000000000000000000' + intToHex(amount, 12);
  return Buffer.from(data, 'hex');
}

function genRawTransaction(tx: Transaction, txType: TxTypes): Buffer {
  const { nonce, gasLimit, gasPrice } = tx;
  const rawTx: any = [
    { prefix: '08', value: 1 }, // version
    { prefix: '10', value: intToNum(nonce) },
    { prefix: '18', value: intToNum(gasLimit) },
    { prefix: '22', value: intToStr(gasPrice) },
  ];
  switch (txType) {
    case TxTypes.Transfer: {
      const { amount, recipient, payload = '' } = tx as Transfer;
      rawTx.push({
        prefix: '52',
        array: [
          { prefix: '0a', value: intToStr(amount) },
          { prefix: '12', value: recipient },
          { prefix: '1a', value: Buffer.from(handleHex(payload), 'hex') },
        ],
      });
      break;
    }
    case TxTypes.Execution: {
      const { amount, contract, data = '' } = tx as Execution;
      rawTx.push({
        prefix: '62',
        array: [
          { prefix: '0a', value: intToStr(amount) },
          { prefix: '12', value: contract },
          { prefix: '1a', value: Buffer.from(handleHex(data), 'hex') },
        ],
      });
      break;
    }
    case TxTypes.XRC20Token: {
      const { amount, recipient, tokenDecimals, tokenSymbol, tokenAddress, tokenSignature } = tx as XRC20Token;
      rawTx.push({
        prefix: '62',
        array: [
          { prefix: '0a', value: '0' },
          { prefix: '12', value: tokenAddress },
          { prefix: '1a', value: encodeXRC20TokenInfo(recipient, amount) },
        ],
      });
      break;
    }
    case TxTypes.StakeCreate: {
      const { candidateName, amount, duration, isAuto, payload = '' } = tx as StakeCreate;
      rawTx.push({
        prefix: 'c202',
        array: [
          { prefix: '0a', value: candidateName },
          { prefix: '12', value: intToStr(amount) },
          { prefix: '18', value: intToNum(duration) },
          { prefix: '20', value: isAuto },
          { prefix: '2a', value: Buffer.from(handleHex(payload), 'hex') },
        ],
      });
      break;
    }
    case TxTypes.StakeUnstake: {
      const { bucketIndex, payload = '' } = tx as StakeUnstake;
      rawTx.push({
        prefix: 'ca02',
        array: [
          { prefix: '08', value: intToNum(bucketIndex) },
          { prefix: '12', value: Buffer.from(handleHex(payload), 'hex') },
        ],
      });
      break;
    }
    case TxTypes.StakeWithdraw: {
      const { bucketIndex, payload = '' } = tx as StakeWithdraw;
      rawTx.push({
        prefix: 'd202',
        array: [
          { prefix: '08', value: intToNum(bucketIndex) },
          { prefix: '12', value: Buffer.from(handleHex(payload), 'hex') },
        ],
      });
      break;
    }
    case TxTypes.StakeDeposit: {
      const { bucketIndex, amount, payload = '' } = tx as StakeDeposit;
      rawTx.push({
        prefix: 'da02',
        array: [
          { prefix: '08', value: intToNum(bucketIndex) },
          { prefix: '12', value: intToStr(amount) },
          { prefix: '1a', value: Buffer.from(handleHex(payload), 'hex') },
        ],
      });
      break;
    }
    default:
      throw new Error('txType is invalid');
  }
  return encodeTx(rawTx);
}

function getSigWithParam(rawTxBuf: Buffer, publicKey: string, sig: { r: string; s: string }) {
  const hash = createKeccakHash('keccak256').update(rawTxBuf).digest('hex');
  const hashBuf = Buffer.from(handleHex(hash), 'hex');
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  const recoveryParam = ec.getKeyRecoveryParam(hashBuf, sig, keyPair.pub);
  return sig.r + sig.s + recoveryParam.toString(16).padStart(2, '0');
}

export function getSignedTransaction(
  tx: Transaction,
  sig: { r: string; s: string },
  publicKey: string,
  txType: TxTypes
) {
  const rawTxBuf = genRawTransaction(tx, txType);
  console.log('rawTxBuf :', rawTxBuf.toString('hex'));
  const signature = getSigWithParam(rawTxBuf, publicKey, sig);
  const uncompressedKey = ec.keyFromPublic(publicKey, 'hex').getPublic(false, 'array');
  const signedTx = [
    { prefix: '0a', value: rawTxBuf },
    { prefix: '12', value: Buffer.from(uncompressedKey) },
    { prefix: '1a', value: Buffer.from(signature, 'hex') },
  ];
  return encodeTx(signedTx).toString('hex');
}
