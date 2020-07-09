import crypto from "crypto";
import { Payment } from "./types";
import * as scripts from "./scripts";
import { handleHex } from "./stringUtil";

const R_B58_DICT = "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz";
const base58 = require("base-x")(R_B58_DICT);

function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function ripemd160(data: Buffer): Buffer {
  return crypto.createHash("rmd160").update(data).digest();
}

// eslint-disable-next-line import/prefer-default-export
export const pubKeyToAddress = (publicKey: string): string => {
  const pubKeyBuf = Buffer.from(publicKey, "hex");
  const pubkeyHash = sha256(pubKeyBuf);
  const accountId = ripemd160(pubkeyHash);

  const addressTypePrefix = Buffer.from("00", "hex");
  const payload = Buffer.concat([addressTypePrefix, accountId]);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const address = base58.encode(Buffer.concat([payload, checksum]));
  return address;
};

const getAccount = (address: string): string => {
  const addressBuf = base58.decode(address);
  const accountBuf = addressBuf.slice(1, 21);
  return accountBuf.toString("hex");
};

const getArgument = (payment: Payment) => {
  const argument =
    handleHex(getAccount(payment.Account)) +
    handleHex(payment.SigningPubKey) +
    handleHex(getAccount(payment.Destination)) +
    handleHex(parseInt(payment.Amount).toString(16).padStart(16, "0")) +
    handleHex(parseInt(payment.Fee).toString(16).padStart(16, "0")) +
    handleHex(payment.Sequence.toString(16).padStart(8, "0")) +
    handleHex(payment.LastLedgerSequence.toString(16).padStart(8, "0")) +
    handleHex(payment.DestinationTag.toString(16).padStart(8, "0")) +
    handleHex(payment.Flags.toString(16).padStart(8, "0"));
  return argument;
};

export const getScriptAndArguments = (
  addressIndex: number,
  payment: Payment
): {
  script: string;
  argument: string;
} => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800000908000000000000000${addressIdxHex}`;
  let script;
  let argument;

  script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
  argument = getArgument(payment);
  return {
    script,
    argument: SEPath + argument,
  };
};
