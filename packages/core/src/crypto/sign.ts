import crypto from 'crypto';
import KeyEncoder from 'key-encoder';

const keyencoder = new KeyEncoder('secp256k1');

/**
 * @param {string} data hex
 * @param {string | Buffer} rawpriv
 * @returns {Buffer}
 */
// eslint-disable-next-line import/prefer-default-export
export const sign = (data: string, rawpriv: string | Buffer): Buffer => {
  const signer = crypto.createSign('sha256');
  const dataBuf = Buffer.from(data, 'hex');
  signer.update(dataBuf);
  const privateKey = keyencoder.encodePrivate(rawpriv, 'raw', 'pem');
  const signature = signer.sign(privateKey);
  return signature;
};
