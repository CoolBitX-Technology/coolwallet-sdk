import { error } from '@coolwallet/core';
import Big, { BigSource } from 'big.js'

import crypto from 'crypto';
import bech32 from 'bech32';
import * as scripts from "./scripts";
import { UVarInt } from './varint';
import { marshalBinary } from './encodeUtil'
import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder, typePrefix } from './types'

const BASENUMBER = Math.pow(10, 8)
const MAX_INT64 = Math.pow(2, 63)

function checkNumber(value: BigSource, name = "input number") {
  if (new Big(value).lte(0)) {
    throw new Error(`${name} should be a positive number`)
  }

  if (new Big(value).gte(MAX_INT64)) {
    throw new Error(`${name} should be less than 2^63`)
  }
}

export function publicKeyToAddress(publicKey: string) {
  const hash = sha256ripemd160(publicKey);
  return encodeAddress(hash);
}

function encodeAddress(value: Buffer, prefix = 'bnb') {
  const words = bech32.toWords(value);
  return bech32.encode(prefix, words);
}

function decodeAddress(value: string) {
  const decodeAddress = bech32.decode(value);
  return Buffer.from(bech32.fromWords(decodeAddress.words));
};

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

function toUintBuffer(input: string, byteSize: number): Buffer {
  const buf = Buffer.from(input, 'hex');
  return Buffer.alloc(byteSize).fill(buf, 40 - buf.length, byteSize);
}

function encodeBinaryByteArray(bytes: Buffer): Buffer {
  const lenPrefix = bytes.length;
  return Buffer.concat([UVarInt.encode(lenPrefix), bytes]);
};

function serializePubKey(unencodedPubKey: Buffer): Buffer {
  const format = unencodedPubKey.readInt8(0)
  let pubBz = Buffer.concat([UVarInt.encode(format), unencodedPubKey.slice(1)]);
  // prefixed with length
  pubBz = encodeBinaryByteArray(unencodedPubKey);
  // add the amino prefix
  pubBz = Buffer.concat([Buffer.from("EB5AE987", "hex"), pubBz]);
  return pubBz;
};

export const composeSignedTransacton = (
  signObj: Transfer,
  canonicalSignature: {
    r: string;
    s: string;
  },
  signPublicKey: Buffer
): string => {
  const fromAddress = signObj.msgs[0].inputs[0].address;
  const toAddress = signObj.msgs[0].outputs[0].address;
  const amount = signObj.msgs[0].inputs[0].coins[0].amount;
  const memo = signObj.memo;
  const sequence = signObj.sequence;

  const accCode = decodeAddress(fromAddress)
  const toAccCode = decodeAddress(toAddress)

  // checkNumber(amount, "amount")

  const coin = {
    denom: "BNB",
    amount: amount,
  };

  const msg = {
    inputs: [
      {
        address: accCode,
        coins: [coin],
      },
    ],
    outputs: [
      {
        address: toAccCode,
        coins: [coin],
      },
    ],
    msgType: typePrefix.MsgSend,
  };

  const pubKey = serializePubKey(signPublicKey);
  const signature = canonicalSignature.r + canonicalSignature.s;
  const signatures = [
    {
      pub_key: pubKey,
      signature: Buffer.from(signature, "hex"),
      account_number: parseInt(signObj.account_number),
      sequence: parseInt(sequence),
    },
  ];

  const stdTx = {
    msg: [msg],
    signatures: signatures,
    memo: memo,
    source: 711,
    data: "",
    msgType: typePrefix.StdTx,
  };
  const bytes = marshalBinary(stdTx);
  return bytes;
}

export const getTransferArgument = (signObj: Transfer) => {
  const from = Buffer.from(signObj.msgs[0].inputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(signObj.msgs[0].outputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const value = signObj.msgs[0].outputs[0].coins[0].amount.toString(16).padStart(16, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  const memo = Buffer.from(signObj.memo, 'ascii').toString('hex');
  return from + to + value + accountNumber + sequence + source + memo;
};

export const getPlaceOrderArgument = (signObj: PlaceOrder) => {
  const id = signObj.msgs[0].id;
  const sideNum = signObj.msgs[0].side;
  if (sideNum != 1 && sideNum != 2) { //1:BUY 2:SELL
    throw new error.SDKError(getPlaceOrderArgument.name, `Unsupport side '${sideNum}'`);
  }
  const symbol = signObj.msgs[0].symbol;
  const timeinforce = signObj.msgs[0].timeinforce;
  if (timeinforce != 1 && timeinforce != 3) { //1:GoodTillExpire 3:ImmediateOrCancel
    throw new error.SDKError(getPlaceOrderArgument.name, `Unsupport timeinforce '${timeinforce}'`);
  }

  const orderAddress = id.split("-")[0].padStart(40, '0');
  const orderSequence = parseInt(id.split("-")[1]).toString(16).padStart(16, '0');
  const senderAddress = Buffer.from(signObj.msgs[0].sender, 'ascii').toString('hex').padStart(128, '0');
  const side = sideNum.toString(16).padStart(2, '0');
  const quoteTokenName = Buffer.from(symbol.split("_")[0], 'ascii').toString('hex').padStart(40, '0');
  const baseTokenName = Buffer.from(symbol.split("_")[1], 'ascii').toString('hex').padStart(40, '0');
  const quantity = signObj.msgs[0].quantity.toString(16).padStart(16, '0');
  const price = signObj.msgs[0].price.toString(16).padStart(16, '0');
  const isImmediate = timeinforce == 1 ? "00" : "01";
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
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

export const getCancelOrderArgument = (signObj: CancelOrder) => {
  const refid = signObj.msgs[0].refid;
  const symbol = signObj.msgs[0].symbol;

  const orderAddress = refid.split("-")[0].padStart(40, '0');
  const orderSequence = parseInt(refid.split("-")[1]).toString(16).padStart(16, '0');
  const senderAddress = Buffer.from(signObj.msgs[0].sender, 'ascii').toString('hex').padStart(128, '0');
  const quoteTokenName = Buffer.from(symbol.split("_")[0], 'ascii').toString('hex').padStart(40, '0');
  const baseTokenName = Buffer.from(symbol.split("_")[1], 'ascii').toString('hex').padStart(40, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  return orderAddress +
    orderSequence +
    senderAddress +
    quoteTokenName +
    baseTokenName +
    accountNumber +
    sequence +
    source;
};

export const getTokenArgument = (signObj: Transfer) => {
  const from = Buffer.from(signObj.msgs[0].inputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(signObj.msgs[0].outputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const value = signObj.msgs[0].outputs[0].coins[0].amount.toString(16).padStart(16, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  const tokenName = '';
  const tokenCheck = '';
  const memo = Buffer.from(signObj.memo, 'ascii').toString('hex');
  return from + to + value + accountNumber + sequence + source + tokenName + tokenCheck + memo;
};

export const getScriptAndArguments = (
  argument: string,
  addressIndex: number
) => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800002${coinType}8000000000000000${addressIdxHex}`;
  // let script;
  // let argument;
  // if (transactionType == TransactionType.TRANSFER) {
  //   script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
  //   argument = getTransferArgument(signObj as Transfer);
  // } else if (transactionType == TransactionType.TOKEN) {
  //   script = scripts.BEP2Token.script + scripts.BEP2Token.signature;
  //   argument = getBUSDArgument(signObj as Transfer);
  // } else if (transactionType == TransactionType.PLACE_ORDER) {
  //   script = scripts.PlaceOrder.script + scripts.PlaceOrder.signature;
  //   argument = getPlaceOrderArgument(signObj as PlaceOrder);
  // } else {//transactionType == TransactionType.CANCEL_ORDER
  //   script = scripts.CancelOrder.script + scripts.CancelOrder.signature;
  //   argument = getCancelOrderArgument(signObj as CancelOrder);
  // }
  return SEPath + argument;
}
