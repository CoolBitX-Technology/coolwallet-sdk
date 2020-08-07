import Big, { BigSource } from 'big.js'

import crypto from 'crypto';
import bech32 from 'bech32';
import * as scripts from "./scripts";
import * as varuint from './varuint';
import { marshalBinary } from './encodeUtil'
import { AminoPrefix } from "./types"

import { coinType, TransactionType, Transfer, PlaceOrder, CancelOrder } from './types'

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
  return Buffer.concat([varuint.encode(lenPrefix), bytes]);
};

function serializePubKey(
  unencodedPubKey: {
    x: string;
    y: string;
  }): Buffer {
  let format = 0x2;
  if (unencodedPubKey.y && (parseInt(unencodedPubKey.y, 16) % 2) == 1) {
    format |= 0x1;
  }
  let pubBz = Buffer.concat([varuint.encode(format), toUintBuffer(unencodedPubKey.x, 32)]);
  // prefixed with length
  pubBz = encodeBinaryByteArray(pubBz);
  // add the amino prefix
  pubBz = Buffer.concat([Buffer.from("EB5AE987", "hex"), pubBz]);
  return pubBz;
};

export const composeSignedTransacton = (
  transactionType: TransactionType,
  signObj: Transfer | PlaceOrder | CancelOrder,
  canonicalSignature: {
    r: string;
    s: string;
  },
  signPublicKey: {
    x: string;
    y: string;
  }
): string => {
  if (transactionType == TransactionType.TRANSFER) {
    return transfer(signObj as Transfer, canonicalSignature, signPublicKey);
  } else if (transactionType == TransactionType.PLACE_ORDER) {
    return transfer(signObj as Transfer, canonicalSignature, signPublicKey);
  } else {
    return transfer(signObj as Transfer, canonicalSignature, signPublicKey);
  }
};
function transfer(
  signObj: Transfer,
  canonicalSignature: {
    r: string;
    s: string;
  },
  signPublicKey: {
    x: string;
    y: string;
  }
) {
  const fromAddress = signObj.msgs[0].inputs[0].address;
  const toAddress = signObj.msgs[0].outputs[0].address;
  const amount = signObj.msgs[0].inputs[0].coins[0].amount;
  const memo = signObj.memo;
  const sequence = signObj.sequence;

  const accCode = decodeAddress(fromAddress)
  const toAccCode = decodeAddress(toAddress)

  checkNumber(amount, "amount")

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
    msgType: "MsgSend",
  };

  const pubKey = serializePubKey(signPublicKey);
  const signature = canonicalSignature.r + canonicalSignature.s;
  const account_number = parseInt(signObj.account_number);

  const signatures = [
    {
      pub_key: pubKey,
      signature: Buffer.from(signature, "hex"),
      account_number: account_number,
      sequence: sequence,
    },
  ];

  const stdTx = {
    msg: [msg],
    signatures: signatures,
    memo: memo,
    source: 711,
    data: "",
    msgType: "StdTx",
  };
  const bytes = marshalBinary(stdTx);
  return bytes;
}

/*
function placeOrder(
  /*fromAddress: string,
  toAddress: string,
  symbol: string,
  side: number,
  price: number,
  quantity: number,
  sequence: number,
  timeinforce = 1
signObj: PlaceOrder
) {
  const fromAddress = signObj.msgs[0].inputs[0].address;
  const toAddress = signObj.msgs[0].outputs[0].address;

  if (!fromAddress) {
    throw new Error("address should not be falsy")
  }
  if (!symbol) {
    throw new Error("symbol should not be falsy")
  }
  if (side !== 1 && side !== 2) {
    throw new Error("side can only be 1 or 2")
  }
  if (timeinforce !== 1 && timeinforce !== 3) {
    throw new Error("timeinforce can only be 1 or 3")
  }
  //const accCode = decodeAddress(fromAddress);
  //const toAccCode = decodeAddress(toAddress);

  const bigPrice = new Big(price)
  const bigQuantity = new Big(quantity)

  const placeOrderMsg = {
    sender: accCode,
    id: `${accCode.toString("hex")}-${sequence! + 1}`.toUpperCase(),
    symbol: symbol,
    ordertype: 2,
    side,
    price: parseFloat(bigPrice.mul(BASENUMBER).toString()),
    quantity: parseFloat(bigQuantity.mul(BASENUMBER).toString()),
    timeinforce: timeinforce,
    aminoPrefix: AminoPrefix.NewOrderMsg,
  }

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
    msgType: "MsgSend",
  };

  const stdTx = {
    msg: [msg],
    signatures: signatures,
    memo: memo,
    source: 711,
    data: "",
    msgType: txType.StdTx,
  };
  const serializedTx = convertObjectToSignBytes(signObj);
  return `0x${serializedTx.toString("hex")}`;

  /*const signMsg = {
    id: placeOrderMsg.id,
    ordertype: placeOrderMsg.ordertype,
    price: placeOrderMsg.price,
    quantity: placeOrderMsg.quantity,
    sender: address,
    side: placeOrderMsg.side,
    symbol: placeOrderMsg.symbol,
    timeinforce: timeinforce,
  }

checkNumber(placeOrderMsg.price, "price")
checkNumber(placeOrderMsg.quantity, "quantity")

const stdTx = {
  msg: [msg],
  signatures: signatures,
  memo: memo,
  source: 711,
  data: "",
  msgType: txType.StdTx,
};

const signedTx = await this._prepareTransaction(
  placeOrderMsg,
  signMsg,
  address,
  sequence,
  ""
)

return this._broadcastDelegate(signedTx)
}
*/


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