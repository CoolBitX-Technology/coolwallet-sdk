import { utils, config } from '@coolwallet/core';
import { MajorType, Integer, Output, Witness, TxTypes, Transaction, MessageTransaction } from '../config/types';
import {
  TRANSFER,
  REGISTER,
  REGISTER_AND_DELEGATE,
  DELEGATE,
  DEREGISTER,
  WITHDRAW,
  ABSTAIN,
  MESSAGE,
} from '../config/params';
import { derivePubKeyFromAccountToIndex, decodeAddress, cborEncode, genInputs, blake2b224 } from './index';

const getFullPath = (rolePath: number, indexPath: number) => {
  const fullPath = utils.getFullPath({
    pathType: config.PathType.BIP32ED25519,
    pathString: `1852'/1815'/0'/${rolePath}/${indexPath}`,
  });
  return fullPath;
};

const getUintArgument = (value: Integer) => {
  const data = cborEncode(MajorType.Uint, value);
  const length = (data.length / 2 - 1).toString(16).padStart(2, '0');
  return length + data.padEnd(18, '0');
};

const getOutputArgument = (output: Output, isTestNet = false) => {
  const { addressBuff, addressEncodeType } = decodeAddress(output.address, isTestNet);
  const encodeType = addressEncodeType.toString(16).padStart(2, '0');
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');
  const amount = getUintArgument(output.amount);
  return encodeType + addressLength + address + amount;
};

const getChangeArgument = (output?: Output, isTestNet = false) => {
  if (!output) return '0'.repeat(202);
  const { addressBuff } = decodeAddress(output.address, isTestNet);
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');
  const amount = getUintArgument(output.amount);
  return addressLength + address + amount;
};

const getKeyHash = (keyHash?: string) => {
  if (!keyHash) throw new Error('keyHash is required');
  if (keyHash.length !== 56) throw new Error('keyHash length is invalid');
  return keyHash;
};

export const getScript = (txType: TxTypes): string => {
  if (txType === TxTypes.Transfer) return TRANSFER.scriptWithSignature;
  if (txType === TxTypes.StakeRegister) return REGISTER.scriptWithSignature;
  if (txType === TxTypes.StakeRegisterAndDelegate) return REGISTER_AND_DELEGATE.scriptWithSignature;
  if (txType === TxTypes.StakeDelegate) return DELEGATE.scriptWithSignature;
  if (txType === TxTypes.StakeDeregister) return DEREGISTER.scriptWithSignature;
  if (txType === TxTypes.StakeWithdraw) return WITHDRAW.scriptWithSignature;
  if (txType === TxTypes.Abstain) return ABSTAIN.scriptWithSignature;
  if (txType === TxTypes.Message) return MESSAGE.scriptWithSignature;
  throw new Error('txType is not recognized');
};

export const getArguments = (
  transaction: Transaction,
  accPubKey: string,
  txType: TxTypes,
  isTestNet = false
): Witness[] => {
  const { addrIndexes, inputs, output, change, fee, ttl, poolKeyHash, withdrawAmount } = transaction;
  const accPubKeyBuff = Buffer.from(accPubKey, 'hex');
  const stakeKeyBuff = derivePubKeyFromAccountToIndex(accPubKeyBuff, 2, 0);
  const stakeKeyHash = blake2b224(stakeKeyBuff).toString('hex').padStart(56, '0');

  let argument = '';
  if (txType === TxTypes.Transfer) {
    if (!output) throw new Error('output is required');
    argument =
      getChangeArgument(change, isTestNet) +
      getOutputArgument(output, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeRegister || txType === TxTypes.StakeDeregister || txType === TxTypes.Abstain) {
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeDelegate || txType === TxTypes.StakeRegisterAndDelegate) {
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      getKeyHash(poolKeyHash) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeWithdraw) {
    if (!withdrawAmount) throw new Error('withdrawAmount is required');
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      getUintArgument(withdrawAmount) +
      genInputs(inputs);
  }

  const witnesses = addrIndexes.map((addrIndex) => {
    const vkey = derivePubKeyFromAccountToIndex(accPubKeyBuff, 0, addrIndex).toString('hex');
    const sig = '';
    const fullPath = getFullPath(0, addrIndex);
    return { arg: `15${fullPath}${argument}`, vkey, sig };
  });

  if (txType === TxTypes.Transfer) return witnesses;

  witnesses.push({
    arg: `15${getFullPath(2, 0)}${argument}`,
    vkey: stakeKeyBuff.toString('hex'),
    sig: '',
  });
  return witnesses;
};

export const getMessageArgument = (
  messageTransaction: MessageTransaction,
  accPubKey: string,
  isTestNet = false
): string => {
  const { addrIndex, receiveAddress, message } = messageTransaction;

  const { addressBuff } = decodeAddress(receiveAddress, isTestNet);
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');
  let argument = addressLength + address;

  const messageBuff = Buffer.from(message, 'utf8');
  const messageLength = messageBuff.length;
  const messagePrefix = cborEncode(MajorType.Byte, messageLength);
  argument += messagePrefix.padStart(6, '0') + messageBuff.toString('hex');

  const fullPath = getFullPath(0, addrIndex);
  return `15${fullPath}${argument}`;
};
