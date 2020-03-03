import crypto from 'crypto';

const R_B58_DICT = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
const base58 = require('base-x')(R_B58_DICT);

function sha256(data:Buffer) :Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

function ripemd160(data: Buffer): Buffer {
  return crypto
    .createHash('rmd160')
    .update(data)
    .digest();
}

// eslint-disable-next-line import/prefer-default-export
export const pubKeyToAddress = (publicKey:string) : string => {
  const pubKeyBuf = Buffer.from(publicKey, 'hex');
  const pubkeyHash = sha256(pubKeyBuf);
  const accountId = ripemd160(pubkeyHash);

  const addressTypePrefix = Buffer.from('00', 'hex');
  const payload = Buffer.concat([addressTypePrefix, accountId]);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const address = base58.encode(Buffer.concat([payload, checksum]));
  return address;
};
