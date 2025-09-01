import { BigNumber } from '@ethersproject/bignumber';
import { bech32 } from 'bech32';
import { MajorType, Integer } from '../config/types';

const bip32Edd25519 = require('bip32-ed25519');
const blake2b = require('blake2b');
const bs58 = require('bs58');

export const derivePubKeyFromAccountToIndex = (accountPubKey: Buffer, roleIndex = 0, index = 0): Buffer => {
  const rolePubKey = bip32Edd25519.derivePublic(accountPubKey, roleIndex);
  return bip32Edd25519.derivePublic(rolePubKey, index).slice(0, 32);
};

export const blake2b224 = (input: Buffer) => {
  return Buffer.from(blake2b(28).update(input).digest());
};

export const accountKeyToAddress = (accPubkey: Buffer, addrIndex: number, isTestNet = false) => {
  const paymentPubKey = derivePubKeyFromAccountToIndex(accPubkey, 0, addrIndex);
  const stakePubKey = derivePubKeyFromAccountToIndex(accPubkey, 2, 0);

  const paymentHash = blake2b224(paymentPubKey);
  const stakeHash = blake2b224(stakePubKey);

  const addressBuff = Buffer.concat([
    isTestNet ? Buffer.allocUnsafe(1).fill(0x00) : Buffer.allocUnsafe(1).fill(0x01),
    paymentHash,
    stakeHash,
  ]);
  const words = bech32.toWords(addressBuff);

  if (isTestNet) {
    return bech32.encode('addr_test', words, 200);
  }
  return bech32.encode('addr', words, 200);
};

export const decodeAddress = (
  address: string,
  isTestNet = false
): { addressBuff: Buffer; addressEncodeType: number } => {
  let addressBuff;
  let addressEncodeType;
  try {
    const { prefix, words } = bech32.decode(address, 150);
    addressBuff = Buffer.from(bech32.fromWords(words));
    const dataLen = addressBuff.length;

    if (isTestNet) {
      if (prefix === 'addr_test' && dataLen === 57) addressEncodeType = 1;
      if (prefix === 'addr_test' && dataLen === 29) addressEncodeType = 2;
    } else {
      if (prefix === 'addr' && dataLen === 57) addressEncodeType = 1;
      if (prefix === 'addr' && dataLen === 29) addressEncodeType = 2;
    }

    // not support staking address
    if (!addressEncodeType) throw new Error('address not supported');
  } catch (err) {
    try {
      addressBuff = bs58.decode(address);
      addressEncodeType = 0;
    } catch (_) {
      throw new Error('address format not recognized');
    }
  }
  return { addressBuff, addressEncodeType };
};

export const cborEncode = (majorType: MajorType, value: Integer): string => {
  const bn = BigNumber.from(value);

  let prefix = majorType << 5;
  let argument = '';
  if (bn.gt('0xffffffffffffffff')) {
    throw new Error('value is over support');
  } else if (bn.gt('0xffffffff')) {
    prefix += 27;
    argument = bn.toHexString().slice(2).padStart(16, '0');
  } else if (bn.gt('0xffff')) {
    prefix += 26;
    argument = bn.toHexString().slice(2).padStart(8, '0');
  } else if (bn.gt('0xff')) {
    prefix += 25;
    argument = bn.toHexString().slice(2);
  } else if (bn.gte('0x18')) {
    prefix += 24;
    argument = bn.toHexString().slice(2);
  } else {
    prefix += bn.toNumber();
  }
  const result = prefix.toString(16).padStart(2, '0') + argument;
  return result;
};

export { genFakeTxBody, genTxBody, genFakeWitness, genWitness, genInputs } from './transactionUtil';

export { getScript, getArguments, getMessageArgument } from './scriptUtil';
