/* eslint-disable @typescript-eslint/no-var-requires */
import codec from 'ripple-binary-codec';
import * as types from '../config/types';
import * as cryptoUtil from './cryptoUtil';
import * as params from '../config/params';

const base58 = require('base-x')(params.R_B58_DICT);

async function getSignClient(netType: types.Networks = types.Networks.MAINNET) {
  const { default: Client } = await import('mina-signer');

  let client;
  if (netType === types.Networks.DEVNET) {
    client = new Client({ network: 'testnet' });
  } else {
    client = new Client({ network: 'mainnet' });
  }
  return client;
}

export const generateRawTx = async (signature: string, payment: types.Payment): string => {
  
  const signClient = await getSignClient(payment.networkId)
  const { senderAddress, receiverAddress, amount, fee, nonce, validUntil, memo } = payment;
  const signedPayment = signClient.signPayment({
    to: receiverAddress,
    from: senderAddress,
    amount: amount,
    fee: fee,
    nonce: nonce,
    validUntil,
    memo
  }, privateKey)

  return codec.encode(payment);
};

export const pubKeyToAddress = (publicKey: string): string => {
  const pubKeyBuf = Buffer.from(publicKey, 'hex');
  const pubkeyHash = cryptoUtil.sha256(pubKeyBuf);
  const accountId = cryptoUtil.ripemd160(pubkeyHash);

  const addressTypePrefix = Buffer.from('00', 'hex');
  const payload = Buffer.concat([addressTypePrefix, accountId]);
  const checksum = cryptoUtil.sha256(cryptoUtil.sha256(payload)).slice(0, 4);
  const address = base58.encode(Buffer.concat([payload, checksum]));
  return address;
};

export const getAccount = (address: string): string => {
  const addressBuf = base58.decode(address);
  const accountBuf = addressBuf.slice(1, 21);
  return accountBuf.toString('hex');
};
