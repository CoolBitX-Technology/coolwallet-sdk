import { utils } from "@coolwallet/core";
import * as types from "../config/types";
import * as params from "../config/params";
import * as stringUtil from "./stringUtil";
import * as txUtil from "./tracsactionUtil";



export const getPaymentArgument = async (
  addressIndex: number,
  payment: types.Payment
): Promise<string> => {
  // const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  // const SEPath = `15328000002C800000908000000000000000${addressIdxHex}`;
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  if (!payment.Account || !payment.SigningPubKey) {
    throw new Error("Account or SigningPubKey is not set");
  }
  const argument =
    stringUtil.handleHex(txUtil.getAccount(payment.Account)) +
    stringUtil.handleHex(payment.SigningPubKey) +
    stringUtil.handleHex(txUtil.getAccount(payment.Destination)) +
    stringUtil.handleHex(parseInt(payment.Amount).toString(16).padStart(16, "0")) +
    stringUtil.handleHex(parseInt(payment.Fee).toString(16).padStart(16, "0")) +
    stringUtil.handleHex(payment.Sequence.toString(16).padStart(8, "0")) +
    stringUtil.handleHex(payment.LastLedgerSequence.toString(16).padStart(8, "0")) +
    stringUtil.handleHex(payment.DestinationTag.toString(16).padStart(8, "0")) +
    stringUtil.handleHex(payment.Flags.toString(16).padStart(8, "0"));
  return SEPath + argument;
};
