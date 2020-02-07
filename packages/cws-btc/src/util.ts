// import crypto from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';

export function pubkeyToP2PKHAddress(publicKey:string, network?: any) : string {
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(publicKey, 'hex'),
    network
  });
  if (typeof address === 'undefined') throw new Error('Unable to convert to address');
  return address;
}

export function pubkeyToSegwitAddress(publicKey:string, network?: any) : string {
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey: Buffer.from(publicKey, 'hex'), network }),
  });
  if (typeof address === 'undefined') throw new Error('Unable to convert to address');
  return address;
}
