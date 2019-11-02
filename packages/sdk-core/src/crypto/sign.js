import crypto from 'crypto'
import KeyEncoder from 'key-encoder'
const keyencoder = new KeyEncoder('secp256k1')

/**
 * @param {string} data hex
 * @param {string | Buffer} rawpriv
 * @returns {Buffer}
 */
export const sign = (data, rawpriv) => {
  const sign = crypto.createSign('sha256')
  data = Buffer.from(data, 'hex')
  sign.update(data)
  const privateKey = keyencoder.encodePrivate(rawpriv, 'raw', 'pem')
  const signature = sign.sign(privateKey)
  return signature
}
