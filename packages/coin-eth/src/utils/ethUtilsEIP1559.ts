import { handleHex } from './stringUtil';
import { EIP1559Transaction } from '../config/types';
import createKeccakHash from 'keccak';
import rlp from 'rlp';

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');

export const getRawHex = (transaction: EIP1559Transaction): Array<Buffer | Buffer[]> => {
  const rawData = [];
  rawData.push('01'); // chainId
  //rawData.push('03'); // Ropsten chainId
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasTipCap);
  rawData.push(transaction.gasFeeCap);
  rawData.push(transaction.gasLimit);
  if (transaction.to !== undefined) {
    rawData.push(transaction.to);
  } else {
    rawData.push('');
  }
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  const raw: Array<Buffer | Buffer[]> = rawData.map((d) => {
    const hex = handleHex(d);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });

  const emptyAccessList = [] as Buffer[];
  raw.push(emptyAccessList);
  return raw;
};

export const composeSignedTransacton = (payload: Array<Buffer | Buffer[]>, v: number, r: string, s: string): string => {
  const transaction = payload;
  if (v === 0) {
    transaction.push(Buffer.allocUnsafe(0));
  } else {
    transaction.push(Buffer.from([v]));
  }
  transaction.push(Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
  const serializedTx = rlp.encode(transaction);
  return `0x02${Buffer.from(serializedTx).toString('hex')}`;
};

export const genEthSigFromSESig = async (
  canonicalSignature: { r: string; s: string },
  payload: Buffer,
  compressedPubkey: string | undefined = undefined
): Promise<{ v: number; r: string; s: string }> => {
  const prefixedPayload = Buffer.concat([Buffer.from([2]), payload]);
  const hash = createKeccakHash('keccak256').update(prefixedPayload).digest();
  const keyPair = ec.keyFromPublic(compressedPubkey, 'hex');

  // get v
  const recoveryParam = ec.getKeyRecoveryParam(hash, canonicalSignature, keyPair.pub);
  const v = recoveryParam;
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return { v, r, s };
};
