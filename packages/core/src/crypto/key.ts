import crypto from 'crypto';
export const generateKeyPair = () => {
  const elliptic = require('elliptic');
  const ec = new elliptic.ec('secp256k1');
  const random = crypto.randomBytes(32);
  const keyPair = ec.keyFromPrivate(random);
  const publicKey = keyPair.getPublic(false, 'hex');
  const privateKey = keyPair.getPrivate('hex');
  return { privateKey, publicKey };
};
