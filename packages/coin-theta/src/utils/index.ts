const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak')
const rlp = require('rlp');

import { utils, config } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import * as params from '../config/params';
import type {
  Integer,
  Options,
  Transaction,
  SendTransaction,
  StakeValidatorTransaction,
  StakeGuardianTransaction,
  StakeEdgeTransaction,
  WithdrawTransaction,
  SmartTransaction,
} from '../config/types';
import { TxTypes } from '../config/types';

export function pubKeyToAddress(compressedPubkey: string): string {
  const uncompressedKey = ec.keyFromPublic(compressedPubkey, "hex").getPublic(false, 'hex');
  const keyBuffer = Buffer.from(uncompressedKey.substr(2), 'hex');
  const keyHash = createKeccakHash('keccak256').update(keyBuffer).digest('hex');
  const address = "0x".concat(keyHash.substr(-40));
  return toChecksumAddress(address);
}

function toChecksumAddress (address: string) {
  address = address.toLowerCase().replace('0x', '')
  var hash = createKeccakHash('keccak256').update(address).digest('hex')
  var ret = '0x'

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

// transactions

const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));
const intToHex = (i: Integer, padBytes=0) => bnToHex(new BigNumber(i), padBytes);
const addIntToHex = (i1: Integer, i2: Integer, padBytes=0) => {
  const bn = new BigNumber(i1);
  return bnToHex(bn.plus(i2), padBytes);
};
const bnToHex = (bn: BigNumber, padBytes=0) => {
  const hex = bn.toString(16);
  if (typeof padBytes === 'number' && padBytes > 0) {
    if (padBytes*2 < hex.length) throw new Error('argument is overlong!');
    return hex.padStart(padBytes*2, '0');
  }
  if (hex === '0') return '';
  return handleHex(hex);
};

export function getScript(txType: TxTypes) {
  switch (txType) {
    case (TxTypes.Send): return params.Send;
    case (TxTypes.StakeValidator): return params.StakeValidator;
    case (TxTypes.StakeGuardian): return params.StakeGuardian;
    case (TxTypes.StakeEdge): return params.StakeEdge;
    case (TxTypes.Withdraw): return params.Withdraw;
    case (TxTypes.Smart): return params.Smart;
    case (TxTypes.Evm): return params.Evm;
    default: throw new Error('txType is invalid');
  }
}

export function getArguments(tx: Transaction, fromAddr: string, txType: TxTypes) {
  const fullPath = utils.getFullPath({
    pathType: config.PathType.BIP32,
    pathString: `44'/500'/0'/0/0`,
  });
  let result = `15${fullPath}`; // length: 22 bytes

  if (txType === TxTypes.Send) {
    const { theta, tfuel, sequence, toAddr } = tx as SendTransaction;
    result += intToHex(theta, 12);
    result += intToHex(tfuel, 12);
    result += addIntToHex(tfuel, params.FEE, 12);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', '');
    result += toAddr.replace('0x', '');
    if (result.length/2 != 106) throw new Error('arguments length is invalid');

  } else if (txType === TxTypes.StakeValidator) {
    const { theta, sequence, toAddr } = tx as StakeValidatorTransaction;
    result += intToHex(theta, 12);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', '');
    result += toAddr.replace('0x', '');
    if (result.length/2 != 82) throw new Error('arguments length is invalid');

  } else if (txType === TxTypes.StakeGuardian) {
    const { theta, sequence, holderSummary } = tx as StakeGuardianTransaction;
    result += intToHex(theta, 12);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', ''); // 20 bytes
    // holderSummary (229): [to (20)][pubkey (48)][pop (96)][sig (65)]
    result += holderSummary.replace('0x', ''); // 229 bytes
    if (result.length/2 != 291) throw new Error('arguments length is invalid');

  } else if (txType === TxTypes.StakeEdge) {
    const { tfuel, sequence, holderSummary } = tx as StakeEdgeTransaction;
    result += intToHex(tfuel, 12);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', ''); // 20 bytes
    // holderSummary (229): [to (20)][pubkey (48)][pop (96)][sig (65)]
    result += holderSummary.replace('0x', ''); // 229 bytes
    if (result.length/2 != 291) throw new Error('arguments length is invalid');

  } else if (txType === TxTypes.Withdraw) {
    const { purpose, sequence, toAddr } = tx as WithdrawTransaction;
    result += intToHex(purpose, 1);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', ''); // 20 bytes
    result += toAddr.replace('0x', ''); // 20 bytes
    if (result.length/2 != 71) throw new Error('arguments length is invalid');

  } else if (txType === TxTypes.Smart) {
    const { value, sequence, toAddr, gasLimit, data } = tx as SmartTransaction;
    result += intToHex(value, 12);
    result += intToHex(sequence, 8);
    result += fromAddr.replace('0x', ''); // 20 bytes
    result += toAddr.replace('0x', ''); // 20 bytes
    result += intToHex(gasLimit, 10);
    result += handleHex(data);

  } else if (txType === TxTypes.Evm) {
    const { value, sequence, toAddr, gasLimit, data } = tx as SmartTransaction;
    result += toAddr.replace('0x', ''); // 20 bytes
    result += intToHex(value, 12);
    result += intToHex(gasLimit, 10);
    result += intToHex(sequence, 8);
    result += handleHex(data);

  } else {
    throw new Error('txType is invalid');
  } 
  return result;
}

// Hex to Rlp Buffer
const h2r = (h: string) => {
  const hex = handleHex(h);
  if (hex === '') return Buffer.alloc(0);
  return Buffer.from(hex, 'hex');
};
// Integer to Rlp Buffer
const i2r = (i: Integer) => h2r(intToHex(i));
const ai2r = (i1: Integer, i2: Integer) => h2r(addIntToHex(i1, i2));
const zeroBuf = Buffer.alloc(0);
const feeArray = [zeroBuf, i2r(params.FEE)];

function input(
  fromAddr: string,
  theta: Integer,
  tfuel: Integer,
  fee: Integer,
  sequence: Integer,
  signature: string
) {
  return [
    h2r(fromAddr),
    [i2r(theta), ai2r(tfuel, fee)],
    i2r(sequence),
    h2r(signature)
  ];
}

function output(
  toAddr: string,
  theta: Integer,
  tfuel: Integer
) {
  return [h2r(toAddr), [i2r(theta), i2r(tfuel)]];
}

function v2Outputs(
  holderSummary: string,
  purpose: Integer
) {
  const hs = handleHex(holderSummary);
  const toAddr = hs.substr(0, 40);
  const pubkey = hs.substr(40, 96);
  const pop = hs.substr(136, 192);
  const sig = hs.substr(328, 130);
  const outArray = output(toAddr, 0, 0);
  return [outArray, i2r(purpose), h2r(pubkey), h2r(pop), h2r(sig)];
}

export function getSignedTransaction(
  tx: Transaction,
  sig: { r:string, s:string },
  publicKey: string,
  txType: TxTypes
) {
  const fromAddr = pubKeyToAddress(publicKey);
  const signature = sig.r + sig.s;
  let signedTx;
  switch (txType) {
    case TxTypes.Send: {
      signedTx = rlp.encode(i2r(2)).toString('hex')
      const { theta, tfuel, sequence, toAddr } = tx as SendTransaction;
      const inArray = [input(fromAddr, theta, tfuel, params.FEE, sequence, signature)];
      const outArray = [output(toAddr, theta, tfuel)];
      signedTx += rlp.encode([feeArray, inArray, outArray]).toString('hex')
      break;
    }
    case TxTypes.StakeValidator: {
      signedTx = rlp.encode(i2r(8)).toString('hex')
      const { theta, sequence, toAddr } = tx as StakeValidatorTransaction;
      const inArray = input(fromAddr, theta, 0, 0, sequence, signature);
      const outArray = output(toAddr, 0, 0);
      const purpose = i2r(0);
      signedTx += rlp.encode([feeArray, inArray, outArray, purpose]).toString('hex')
      break;
    }
    case TxTypes.StakeGuardian: {
      signedTx = rlp.encode(i2r(10)).toString('hex')
      const { theta, sequence, holderSummary } = tx as StakeGuardianTransaction;
      const inArray = input(fromAddr, theta, 0, 0, sequence, signature);
      const outArrays = v2Outputs(holderSummary, 1);
      signedTx += rlp.encode([feeArray, inArray, ...outArrays]).toString('hex')
      break;
    }
    case TxTypes.StakeEdge: {
      signedTx = rlp.encode(i2r(10)).toString('hex')
      const { tfuel, sequence, holderSummary } = tx as StakeEdgeTransaction;
      const inArray = input(fromAddr, 0, tfuel, 0, sequence, signature);
      const outArrays = v2Outputs(holderSummary, 2);
      signedTx += rlp.encode([feeArray, inArray, ...outArrays]).toString('hex')
      break;
    }
    case TxTypes.Withdraw: {
      signedTx = rlp.encode(i2r(9)).toString('hex')
      const { purpose: p, sequence, toAddr } = tx as WithdrawTransaction;
      const inArray = input(fromAddr, 0, 0, 0, sequence, signature);
      const outArray = output(toAddr, 0, 0);
      const purpose = i2r(p);
      signedTx += rlp.encode([feeArray, inArray, outArray, purpose]).toString('hex')
      break;
    }
    case TxTypes.Smart: {
      signedTx = rlp.encode(i2r(7)).toString('hex')
      const { value, sequence, toAddr, gasLimit: g, data: d } = tx as SmartTransaction;
      const inArray = input(fromAddr, 0, 0, 0, sequence, signature);
      const outArray = output(toAddr, 0, 0);
      const gasLimit = i2r(g);
      const data = h2r(d);
      const gasPrice = h2r('03a352944000');
      signedTx += rlp.encode([inArray, outArray, gasLimit, gasPrice, data]).toString('hex')
      break;
    }
    case TxTypes.Evm: {
      const { value, sequence, toAddr, gasLimit, data } = tx as SmartTransaction;
      let rlpArray = [];
      rlpArray.push(i2r(sequence));
      rlpArray.push(i2r(4000000000000));
      rlpArray.push(i2r(gasLimit));
      rlpArray.push(h2r(toAddr));
      rlpArray.push(i2r(value));
      rlpArray.push(h2r(data));
      rlpArray.push(i2r(361)); // chainId
      rlpArray.push(zeroBuf);
      rlpArray.push(zeroBuf);

      const rawData = rlp.encode(rlpArray);
      const hash = createKeccakHash('keccak256').update(rawData).digest('hex');
      const hashBuf = Buffer.from(handleHex(hash), 'hex');
      const keyPair = ec.keyFromPublic(publicKey, 'hex');
      const recoveryParam = ec.getKeyRecoveryParam(hashBuf, sig, keyPair.pub);
      const v = recoveryParam + 757; // 35 + (361 * 2)

      rlpArray[6] = i2r(v);
      rlpArray[7] = h2r(sig.r);
      rlpArray[8] = h2r(sig.s);
      signedTx = rlp.encode(rlpArray).toString('hex')
      break;
    }
    default:
      throw new Error('txType is invalid');
  } 

  return signedTx;
}
