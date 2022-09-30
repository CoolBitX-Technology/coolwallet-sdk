/* eslint-disable @typescript-eslint/no-var-requires */
import RLP from 'rlp'
import BigNumber from 'bignumber.js';
import { utils, config } from '@coolwallet/core';
import { Integer, Param, TxParam, TokenParam, CertParam, SignType } from '../config/types';
import * as params from '../config/params';
import tokenInfos from '../config/tokenInfos';
import Web3 from 'web3';

const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const blake2b = require('blake2b');
const createKeccakHash = require('keccak');
const fastJsonStableStringify = require('fast-json-stable-stringify')

/**
 * Convert public key to address
 * @param {string} compressedPubkey
 * @return {string}
 */
export function pubKeyToAddress(compressedPubkey: string): string {
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');
  const pubkey = Buffer.from(keyPair.getPublic(false, 'hex').substr(2), 'hex');
  const pubkeyHash = createKeccakHash('keccak256').update(pubkey).digest('hex');
  const address = '0x'.concat(pubkeyHash.substr(pubkeyHash.length - 40));
  return Web3.utils.toChecksumAddress(address);
}

export function handleHex(hex: string, padBytes=0): string {
  const prefixRemoved = hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;
  if (prefixRemoved === '') return ''.padStart(padBytes*2, '0');
  if (/^([0-9A-Fa-f])+$/.test(prefixRemoved)) {
    const result = prefixRemoved.length % 2 !== 0 ? `0${prefixRemoved}` : prefixRemoved;
    return result.padStart(padBytes*2, '0');
  }
  throw new Error(`invalid hex string : ${hex}`);
}

function intToHex(integer: Integer, padBytes?: number) {
  let bn = new BigNumber(integer).toString(16);
  bn = bn === '0' ? '' : bn;
  return handleHex(bn, padBytes);
}

function hexToBuf(hex: string): Buffer {
  return Buffer.from(handleHex(hex), 'hex');
}

function intToBuf(integer: Integer): Buffer {
  let bn = new BigNumber(integer).toString(16);
  bn = bn === '0' ? '' : bn;
  return hexToBuf(bn);
}

function getCertificateHex(certificate: CertParam): string {
  const jsonStr = fastJsonStableStringify({ ...certificate, signer: certificate.signer.toLowerCase() });
  return Buffer.from(jsonStr).toString('hex');
}

const getSetTokenPayload = (decimals: number, symbol: string, contractAddress: string): string => {

  let deci;
  let symb;
  let addr;
  let sig = '';

  const info = tokenInfos.find((i) => {
    return handleHex(i.contractAddress).toLowerCase() === handleHex(contractAddress).toLowerCase();
  });

  if (info) {
    deci = info.decimals;
    symb = info.symbol;
    addr = info.contractAddress;
    sig = info.signature;
  } else {
    deci = decimals;
    symb = symbol;
    addr = contractAddress;
  }

  const decimalsHex = intToHex(deci);
  if (symb.length > 7) {
    symb = symb.substring(0, 7);
  }
  const lenHex = intToHex(symb.length);
  const symbolHex = handleHex(Buffer.from(symb).toString('hex')).padEnd(14, '0');
  const setTokenPayload = decimalsHex + lenHex + symbolHex + handleHex(addr) + sig.padStart(144, '0');
  return setTokenPayload;
};

const getDataArgument = (str: string) => {
  const data = handleHex(str);
  return (data === '') ? '00' : '01' + data;
};

const getTransactionArgument = (param: TxParam) => {
  const clause = param.clauses[0];
  if (!clause) throw new Error('invalid clauses');
  if (clause.to === null) throw new Error('contract deployment not supported');
  const blockRef = handleHex(param.blockRef, 8);
  const expiration = intToHex(param.expiration, 4);
  const to = handleHex(clause.to);
  const value = intToHex(clause.value, 32);
  const gasPriceCoef = intToHex(param.gasPriceCoef, 1);
  const gas = intToHex(param.gas, 8);
  const dependsOn = handleHex(param.dependsOn, 32);
  const nonce = handleHex(param.nonce, 8);
  const isVip191 = (param.reserved?.features === 1) ? '01' : '00';

  const commonArg = blockRef + expiration + to + value + gasPriceCoef + gas + dependsOn + nonce + isVip191;
  const dataArg = getDataArgument(param.clauses[0]?.data);
  return commonArg + dataArg;
};

const getTokenArgument = (param: TokenParam) => {
  const blockRef = handleHex(param.blockRef, 8);
  const expiration = intToHex(param.expiration, 4);
  const to = handleHex(param.recipient);
  const value = intToHex(param.value, 32);
  const gasPriceCoef = intToHex(param.gasPriceCoef, 1);
  const gas = intToHex(param.gas, 8);
  const dependsOn = handleHex(param.dependsOn, 32);
  const nonce = handleHex(param.nonce, 8);
  const isVip191 = param.isVip191 ? '01' : '00';

  const commonArg = blockRef + expiration + to + value + gasPriceCoef + gas + dependsOn + nonce + isVip191;
  const tokenArg = getSetTokenPayload(param.decimals, param.symbol, param.contractAddress);
  return commonArg + tokenArg;
};

export const getScriptAndArguments = (addressIndex: number, param: Param, signType: SignType) => {
  const fullPath = '15' + utils.getFullPath({
    pathType: config.PathType.BIP32,
    pathString: `44'/818'/0'/0/${addressIndex}`,
  });

  let script;
  let argument;
  if (signType === SignType.Transaction) {
    script = params.TRANSACTION;
    argument = getTransactionArgument(param as TxParam);

  } else if (signType === SignType.Token) {
    script = params.TOKEN;
    argument = getTokenArgument(param as TokenParam);

  } else if (signType === SignType.Certification) {
    script = params.CERT;
    argument = getCertificateHex(param as CertParam);

  } else {
    throw new Error('signType unsupported');
  }

  return {
    script: script.script + script.signature.padStart(144, '0'),
    argument: fullPath + argument,
  };
};

export const genRawTransaction = (param: Param, signType: SignType): any => {
  if (signType === SignType.Transaction) {
    const {
      blockRef,
      expiration,
      clauses,
      gasPriceCoef,
      gas,
      dependsOn,
      nonce,
      reserved,
    } = param as TxParam;

    const clause = clauses[0];
    if (!clause) throw new Error('invalid clauses');
    if (clause.to === null) throw new Error('contract deployment not supported');

    const to = hexToBuf(clause.to);
    const value = intToBuf(clause.value);
    const data = hexToBuf(clause.data);

    const raw = []
    raw.push(hexToBuf('4a'));
    raw.push(intToBuf(blockRef)); // thor-devkit : RLP.CompactFixedBlobKind
    raw.push(intToBuf(expiration));
    raw.push([[to, value, data]]);
    raw.push(intToBuf(gasPriceCoef));
    raw.push(intToBuf(gas));
    raw.push(hexToBuf(dependsOn));
    raw.push(hexToBuf(nonce));
    raw.push((reserved?.features === 1) ? [intToBuf(1)] : []);
    return raw;

  } else if (signType === SignType.Token) {
    const {
      blockRef,
      expiration,
      gasPriceCoef,
      gas,
      dependsOn,
      nonce,
      isVip191,
      contractAddress,
      recipient,
      value: tokenValue,
    } = param as TokenParam;

    const to = hexToBuf(contractAddress);
    const value = intToBuf(0);
    const data = hexToBuf('a9059cbb' + handleHex(recipient, 32) + intToHex(tokenValue, 32));

    const raw = []
    raw.push(hexToBuf('4a'));
    raw.push(intToBuf(blockRef)); // thor-devkit : RLP.CompactFixedBlobKind
    raw.push(intToBuf(expiration));
    raw.push([[to, value, data]]);
    raw.push(intToBuf(gasPriceCoef));
    raw.push(intToBuf(gas));
    raw.push(hexToBuf(dependsOn));
    raw.push(hexToBuf(nonce));
    raw.push(isVip191 ? [intToBuf(1)] : []);
    return raw;

  } else if (signType === SignType.Certification) {
    return getCertificateHex(param as CertParam);

  } else {
    throw new Error('signType unsupported');
  }
};

function getSigWithParam(rawTxBuf: Buffer, publicKey: string, sig: { r: string; s: string }) {
  const hashBuf = Buffer.from(blake2b(32).update(rawTxBuf).digest());
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  const recoveryParam = ec.getKeyRecoveryParam(hashBuf, sig, keyPair.pub);
  return sig.r + sig.s + recoveryParam.toString(16).padStart(2, '0');
}

export function getSignedTransaction(
  param: Param,
  sig: { r: string; s: string },
  publicKey: string,
  signType: SignType
) {
  const rawTx = genRawTransaction(param, signType);
  const rawTxBuf = signType === SignType.Certification
    ? Buffer.from(rawTx, 'hex')
    : Buffer.from(RLP.encode(rawTx));
  // console.log('rawTxBuf :', rawTxBuf.toString('hex'));

  const signature = getSigWithParam(rawTxBuf, publicKey, sig);
  // console.log('signature :', signature);
  if (signType === SignType.Certification) return signature;

  const signedTx = [...rawTx, hexToBuf(signature)];
  return Buffer.from(RLP.encode(signedTx)).toString('hex');
}
