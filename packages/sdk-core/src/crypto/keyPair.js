const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')

export const generateKeyPair = () => {
  let random = new Uint8Array(32)
  window.crypto.getRandomValues(random)
  const keyPair = ec.keyFromPrivate(random)
  const publicKey = keyPair.getPublic(false, 'hex')
  const privateKey = keyPair.getPrivate('hex')
  return { privateKey, publicKey }
}
