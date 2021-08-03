import * as types from "../config/types";
import * as cryptoUtil from "./cryptoUtil";
import * as params from "../config/params";

const base58 = require("base-x")(params.R_B58_DICT);
const codec = require("ripple-binary-codec");

export const generateRawTx = (signature: string, payment: types.Payment): string => {
  /* eslint-disable-next-line no-param-reassign */
  payment.TxnSignature = signature.toUpperCase();
  return codec.encode(payment);
};

// eslint-disable-next-line import/prefer-default-export
export const pubKeyToAddress = (publicKey: string): string => {
  const pubKeyBuf = Buffer.from(publicKey, "hex");
  const pubkeyHash = cryptoUtil.sha256(pubKeyBuf);
  const accountId = cryptoUtil.ripemd160(pubkeyHash);

  const addressTypePrefix = Buffer.from("00", "hex");
  const payload = Buffer.concat([addressTypePrefix, accountId]);
  const checksum = cryptoUtil.sha256(cryptoUtil.sha256(payload)).slice(0, 4);
  const address = base58.encode(Buffer.concat([payload, checksum]));
  return address;
};

export const getAccount = (address: string): string => {
  const addressBuf = base58.decode(address);
  const accountBuf = addressBuf.slice(1, 21);
  return accountBuf.toString("hex");
};
