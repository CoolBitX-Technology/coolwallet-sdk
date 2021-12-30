import { apdu, utils, config } from '@coolwallet/core';
import { signTxType, Transport } from '../config/types';
import * as params from '../config/params';
import * as txUtil from './tracsactionUtil';

export const getPath = (roleIndex?: number, addressIndex?: number) => {
  var pathString = "1852'/1815'/0'";
  if (roleIndex !== undefined && roleIndex !== null) {
    pathString = pathString + '/' + roleIndex;
  }
  if (addressIndex !== undefined && addressIndex !== null) {
    pathString = pathString + '/' + addressIndex;
  }
  return utils.getFullPath({
    pathType: config.PathType.BIP32ED25519,
    pathString: pathString,
  });
};

export const getPaymentArgument = async (addressIndex: number): Promise<string> => {
  const SEPath = `15${await getPath(0, addressIndex)}`;

  const argument = '';
  //stringUtil.handleHex(txUtil.getAccount(payment.Account)) +
  //stringUtil.handleHex(payment.SigningPubKey) +
  //stringUtil.handleHex(txUtil.getAccount(payment.Destination)) +
  //stringUtil.handleHex(parseInt(payment.Amount).toString(16).padStart(16, '0')) +
  //stringUtil.handleHex(parseInt(payment.Fee).toString(16).padStart(16, '0')) +
  //stringUtil.handleHex(payment.Sequence.toString(16).padStart(8, '0')) +
  //stringUtil.handleHex(payment.LastLedgerSequence.toString(16).padStart(8, '0')) +
  //stringUtil.handleHex(payment.DestinationTag.toString(16).padStart(8, '0')) +
  //stringUtil.handleHex(payment.Flags.toString(16).padStart(8, '0'));
  return SEPath + argument;
};
