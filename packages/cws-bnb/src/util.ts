import crypto from 'crypto';
import bech32 from 'bech32';
import * as scripts from "./scripts";
import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder } from './types'

export function publicKeyToAddress(publicKey: string) {
  const hash = sha256ripemd160(publicKey);
  return encodeAddress(hash);
}

function encodeAddress(value: Buffer, prefix = 'bnb') {
  const words = bech32.toWords(value);
  return bech32.encode(prefix, words);
}

function sha256ripemd160(publicKey: string): Buffer {
  const hash = crypto.createHash('SHA256').update(Buffer.from(publicKey, 'hex')).digest();
  return crypto.createHash('ripemd160').update(hash).digest();
}

function sortObject(obj: any): any {
  if (obj === null) {
    return null;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  sortedKeys.forEach((key) => {
    (result as any)[key] = sortObject(obj[key]);
  });
  return result;
}

export const convertObjectToSignBytes = (obj: any) => Buffer.from(JSON.stringify(sortObject(obj)));

export function combineSignature(canonicalSignature: any): string {
  return canonicalSignature.r + canonicalSignature.s;
}

const getTransferArgument = (signObj: Transfer) => {
  const from = signObj.msgs[0].inputs[0].address.padStart(128, '0');
  const to = signObj.msgs[0].outputs[0].address.padStart(128, '0');
  const value = signObj.msgs[0].outputs[0].coins[0].amount.toString(16).padStart(16, '0');
  const accountNumber = signObj.account_number.padStart(16, '0');
  const sequence = signObj.sequence.padStart(16, '0');
  const source = signObj.source.padStart(16, '0');
  const memo = signObj.memo;
  return from + to + value + accountNumber + sequence + source + memo;
};

const getPlaceOrderArgument = (signObj: PlaceOrder) => {
  const orderAddress = signObj.msgs[0].sender.padStart(40, '0');
  const orderSequence = signObj.sequence.padStart(16, '0');
  const senderAddress = signObj.msgs[0].sender.padStart(128, '0');
  const side = signObj.msgs[0].side.toString().padStart(2, '0');
  const quoteTokenName = signObj.msgs[0].symbol.padStart(40, '0');
  const baseTokenName = signObj.msgs[0].symbol.padStart(40, '0');
  const quantity = signObj.msgs[0].quantity.toString(16).padStart(16, '0');
  const price = signObj.msgs[0].price.toString(16).padStart(16, '0');
  const isImmediate = signObj.msgs[0].timeinforce.toString(16).padStart(2, '0');
  const accountNumber = signObj.account_number.padStart(16, '0');
  const sequence = signObj.sequence.padStart(16, '0');
  const source = signObj.source.padStart(16, '0');
  return orderAddress +
    orderSequence +
    senderAddress +
    side +
    quoteTokenName +
    baseTokenName +
    quantity +
    price +
    isImmediate +
    accountNumber +
    sequence +
    source;
};

const getCancelOrderArgument = (signObj: CancelOrder) => {
  const orderAddress = signObj.msgs[0].sender.padStart(40, '0');
  const orderSequence = signObj.sequence.padStart(16, '0');
  const senderAddress = signObj.msgs[0].sender.padStart(128, '0');
  const quoteTokenName = signObj.msgs[0].symbol.padStart(40, '0');
  const baseTokenName = signObj.msgs[0].symbol.padStart(40, '0');
  const accountNumber = signObj.account_number.padStart(16, '0');
  const sequence = signObj.sequence.padStart(16, '0');
  const source = signObj.source.padStart(16, '0');
  return orderAddress +
    orderSequence +
    senderAddress +
    quoteTokenName +
    baseTokenName +
    accountNumber +
    sequence +
    source;
};

export const getScriptAndArguments = (
  transactionType: TransactionType,
  addressIndex: number,
  signObj: Transfer | PlaceOrder | CancelOrder
) => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800002${coinType}8000000000000000${addressIdxHex}`;
  let script;
  let argument;
  if (transactionType == TransactionType.TRANSFER) {
    script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
    argument = getTransferArgument(signObj as Transfer);
  } else if (transactionType == TransactionType.PLACE_ORDER) {
    script = scripts.PlaceOrder.script + scripts.PlaceOrder.signature;
    argument = getPlaceOrderArgument(signObj as PlaceOrder);
  } else {//transactionType == TransactionType.CANCEL_ORDER
    script = scripts.CancelOrder.script + scripts.CancelOrder.signature;
    argument = getCancelOrderArgument(signObj as CancelOrder);
  }
  return {
    script,
    argument: SEPath + argument,
  };
}