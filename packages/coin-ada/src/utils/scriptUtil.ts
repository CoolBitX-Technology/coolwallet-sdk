import { utils, config } from '@coolwallet/core';
import { signTxType } from '../config/types';
import { handleHex } from './stringUtil';
import { decodeAddress } from './index';

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

export const getPaymentArgument = async (signTxData: signTxType): Promise<string> => {
  const SEPath = `15${await getPath(0, signTxData.input.addressIndex)}`;
  let inputs = (80 + signTxData.input.utxos.length).toString(16);
  for (const utxo of signTxData.input.utxos) {
    inputs = inputs + '825820';
    inputs = inputs + utxo.preTxHash;
    inputs = inputs + utxo.preIndex;
  }

  const argument =
    signTxData.change.pubkeyBuf.toString('hex') +
    getPrefix(signTxData.change.value) +
    signTxData.change.value.padStart(16, '0') +
    decodeAddress(signTxData.output.address).addressBuff.slice(1, 65).toString('hex') +
    getPrefix(signTxData.output.value) +
    signTxData.output.value.padStart(16, '0') +
    getPrefix(signTxData.fee) +
    signTxData.fee.padStart(16, '0') +
    getPrefix(signTxData.invalidHereafter.toString(16)) +
    signTxData.invalidHereafter.toString(16).padStart(16, '0') +
    inputs;

  return SEPath + argument;
};

export const getPrefix = (input: string): string => {
  const buf = Buffer.from(handleHex(input), 'hex');
  if (buf.length <= 2) {
    return '18';
  } else if (buf.length <= 4) {
    return '19';
  } else if (buf.length <= 8) {
    return '1a';
  } else {
    return '1b';
  }
};
