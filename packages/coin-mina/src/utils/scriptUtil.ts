import { utils } from '@coolwallet/core';
import * as types from '../config/types';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
// import * as txUtil from "./trancsactionUtil";

export const getPaymentArgument = async (addressIndex: number, payment: types.Payment): Promise<string> => {
  const {
    txType,
    senderAccount,
    senderAddress,
    receiverAddress,
    amount,
    fee,
    nonce,
    validUntil = 4294967295,
    memo = '',
    networkId,
  }: types.Payment = payment;

  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;

  const senderBip44AccountHex = stringUtil.pad(senderAccount.toString(16), 8);
  const senderAddressHex = stringUtil.asciiToHex(senderAddress);
  const receiverHex = stringUtil.asciiToHex(receiverAddress);
  const amountHex = stringUtil.pad(amount.toString(16), 16);
  const feeHex = stringUtil.pad(fee.toString(16), 16);
  const nonceHex = stringUtil.pad(Number(nonce).toString(16).toUpperCase(), 8);
  const validUntilHex = stringUtil.pad(validUntil.toString(16), 8);
  const memoHex = stringUtil.convertMemo(memo);
  const tagHex = stringUtil.pad(txType.toString(16), 2);
  const networkIdHex = stringUtil.pad(networkId, 2);

  const argument =
    senderBip44AccountHex +
    senderAddressHex +
    receiverHex +
    amountHex +
    feeHex +
    nonceHex +
    validUntilHex +
    memoHex +
    tagHex +
    networkIdHex;

  return SEPath + argument;
};
