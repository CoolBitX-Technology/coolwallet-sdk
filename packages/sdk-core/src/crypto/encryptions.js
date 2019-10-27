import crypto from 'crypto'

/**
 * @param {string} recipientPubKey 
 * @param {string} msg 
 * @returns {string}
 */
export const ECIESenc = (recipientPubKey, msg) => {
  msg = Buffer.from(msg, 'hex')
  const ephemeral = crypto.createECDH('secp256k1')
  ephemeral.generateKeys()
  const sharedSecret = ephemeral.computeSecret(Buffer.from(recipientPubKey, 'hex'), null, 'hex')
  const hashedSecret = sha512(Buffer.from(sharedSecret, 'hex'))
  const encryptionKey = hashedSecret.slice(0, 32)
  const macKey = hashedSecret.slice(32)
  let iv = Buffer.allocUnsafe(16)
  iv.fill(0)

  const ciphertext = aes256CbcEncrypt(iv, encryptionKey, msg)
  const dataToMac = Buffer.concat([iv, ephemeral.getPublicKey(), ciphertext])
  const mac = hmacSha1(macKey, dataToMac)
  const encData = ephemeral.getPublicKey().toString('hex') + mac.toString('hex') + ciphertext.toString('hex')
  return encData
}

/**
 * 
 * @param {string} recipientPrivKey 
 * @param {string} encryption 
 * @returns {Buffer}
 */
export const ECIESDec = (recipientPrivKey, encryption) => {
  encryption = Buffer.from(encryption, 'hex')
  const ephemeralPubKey = encryption.slice(0, 65)
  const mac = encryption.slice(65, 85)
  const ciphertext = encryption.slice(85)
  const recipient = crypto.createECDH('secp256k1')
  recipient.setPrivateKey(Buffer.from(recipientPrivKey, 'hex'))
  const sharedSecret = recipient.computeSecret(ephemeralPubKey, null, 'hex')
  const hashedSecret = sha512(Buffer.from(sharedSecret, 'hex'))
  const encryptionKey = hashedSecret.slice(0, 32)
  const macKey = hashedSecret.slice(32)

  let iv = Buffer.alloc(16)
  iv.fill(0)
  const dataToMac = Buffer.concat([iv, ephemeralPubKey, ciphertext])
  const realMac = hmacSha1(macKey, dataToMac)

  if (!!equalConstTime(mac, realMac)) {
    return aes256CbcDecrypt(iv, encryptionKey, ciphertext).toString('hex')
  } else {
    return false
  }
}

const sha512 = msg => {
  return crypto
    .createHash('sha512')
    .update(msg)
    .digest()
}

const aes256CbcEncrypt = (iv, key, plaintext) => {
  let cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const firstChunk = cipher.update(plaintext)
  const secondChunk = cipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

export const aes256CbcDecrypt = (iv, key, ciphertext) => {
  let isCipherBuffer = ciphertext
  if (!Buffer.isBuffer(ciphertext)) {
    isCipherBuffer = Buffer.from(isCipherBuffer, 'hex')
  }
  let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const firstChunk = decipher.update(isCipherBuffer)
  const secondChunk = decipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

/**
 * 
 * @param {Buffer} key 
 * @param {Buffer} msg 
 * @returns {Buffer}
 */
const hmacSha1 = (key, msg) => {
  return crypto
    .createHmac('sha1', key)
    .update(msg)
    .digest()
}

const equalConstTime = (b1, b2) => {
  if (b1.length !== b2.length) {
    return false
  }
  var res = 0
  for (var i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i] // jshint ignore:line
  }
  return res === 0
}
