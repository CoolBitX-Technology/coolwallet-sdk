
import * as cryptoUtil from "./cryptoUtil";
import bech32 from 'bech32'; 
import * as txUtil from "./transactionUtil";
import { UVarInt } from './varint';
import * as encodeUtil from './encodeUtil'
import { Transfer, typePrefix } from '../config/types'


export function publicKeyToAddress(publicKey: string) {
  const hash = cryptoUtil.sha256ripemd160(publicKey);
  return encodeAddress(hash);
}

export function encodeAddress(value: Buffer, prefix = 'bnb') {
  const words = bech32.toWords(value);
  return bech32.encode(prefix, words);
}

export function decodeAddress(value: string) {
  const decodeAddress = bech32.decode(value);
  return Buffer.from(bech32.fromWords(decodeAddress.words));
};

export function serializePubKey(unencodedPubKey: Buffer): Buffer {
  const format = unencodedPubKey.readInt8(0)
  let pubBz = Buffer.concat([UVarInt.encode(format), unencodedPubKey.slice(1)]);
  // prefixed with length
  pubBz = encodeUtil.encodeBinaryByteArray(unencodedPubKey);
  // add the amino prefix
  pubBz = Buffer.concat([Buffer.from("EB5AE987", "hex"), pubBz]);
  return pubBz;
};


export const composeSignedTransacton = (
  signObj: Transfer,
  denom: string,
  signature: string,
  signPublicKey: Buffer
): string => {
  const fromAddress = signObj.msgs[0].inputs[0].address;
  const toAddress = signObj.msgs[0].outputs[0].address;
  const amount = signObj.msgs[0].inputs[0].coins[0].amount;
  const memo = signObj.memo;
  const sequence = signObj.sequence;

  const accCode = txUtil.decodeAddress(fromAddress)
  const toAccCode = txUtil.decodeAddress(toAddress)

  const coin = {
    denom: denom,
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

  const pubKey = txUtil.serializePubKey(signPublicKey);
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
  const bytes = encodeUtil.marshalBinary(stdTx);
  return bytes;
}
