import crypto from 'crypto';

const sha512 = (msg: string | Buffer) => crypto
  .createHash('sha512')
  .update(msg)
  .digest();

const aes256CbcEncrypt = (iv: any, key: any, plaintext: any) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const firstChunk = cipher.update(plaintext);
  const secondChunk = cipher.final();
  return Buffer.concat([firstChunk, secondChunk]);
};

export const aes256CbcDecrypt = (iv: any, key: any, ciphertext: any) => {
  let isCipherBuffer = ciphertext;
  if (!Buffer.isBuffer(ciphertext)) {
    isCipherBuffer = Buffer.from(isCipherBuffer, 'hex');
  }
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const firstChunk = decipher.update(isCipherBuffer);
  const secondChunk = decipher.final();
  return Buffer.concat([firstChunk, secondChunk]);
};

/**
 *
 * @param {Buffer} key
 * @param {Buffer} msg
 * @returns {Buffer}
 */
const hmacSha1 = (key: Buffer, msg: Buffer): Buffer => crypto
  .createHmac('sha1', key)
  .update(msg)
  .digest();

const equalConstTime = (b1: Buffer, b2: Buffer) => {
  if (b1.length !== b2.length) {
    return false;
  }
  let res = 0;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < b1.length; i++) {
    // eslint-disable-next-line no-bitwise
    res |= b1[i] ^ b2[i];
  }
  return res === 0;
};

/**
 * @param {string} recipientPubKey
 * @param {string} msg
 * @returns {string}
 */
export const ECIESenc = (recipientPubKey: string, msg: string): string => {
  const msgBuf = Buffer.from(msg, 'hex');
  const ephemeral = crypto.createECDH('secp256k1');
  ephemeral.generateKeys();
  const sharedSecret = ephemeral.computeSecret(Buffer.from(recipientPubKey, 'hex'), 'hex');
  const hashedSecret = sha512(Buffer.from(sharedSecret, 'hex'));

  const encryptionKey = hashedSecret.slice(0, 32);
  const macKey = hashedSecret.slice(32);
  const iv = Buffer.allocUnsafe(16);
  iv.fill(0);

  const ciphertext = aes256CbcEncrypt(iv, encryptionKey, msgBuf);
  const dataToMac = Buffer.concat([iv, ephemeral.getPublicKey(), ciphertext]);
  const mac = hmacSha1(macKey, dataToMac);
  const encData = ephemeral.getPublicKey().toString('hex') + mac.toString('hex') + ciphertext.toString('hex');
  return encData;
};

/**
 *
 * @param {string} recipientPrivKey
 * @param {string} encryption
 * @returns {Buffer}
 */
export const ECIESDec = (recipientPrivKey: string, encryption: string): string | undefined => {
  const encryptionBuf = Buffer.from(encryption, 'hex');
  const ephemeralPubKey = encryptionBuf.slice(0, 65);
  const mac = encryptionBuf.slice(65, 85);
  const ciphertext = encryptionBuf.slice(85);
  const recipient = crypto.createECDH('secp256k1');
  recipient.setPrivateKey(Buffer.from(recipientPrivKey, 'hex'));
  const sharedSecret = recipient.computeSecret(ephemeralPubKey, 'hex');
  const hashedSecret = sha512(sharedSecret);
  const encryptionKey = hashedSecret.slice(0, 32);
  const macKey = hashedSecret.slice(32);

  const iv = Buffer.alloc(16);
  iv.fill(0);
  const dataToMac = Buffer.concat([iv, ephemeralPubKey, ciphertext]);
  const realMac = hmacSha1(macKey, dataToMac);
  if (equalConstTime(mac, realMac)) {
    return aes256CbcDecrypt(iv, encryptionKey, ciphertext).toString('hex');
  }
  return undefined;
};
