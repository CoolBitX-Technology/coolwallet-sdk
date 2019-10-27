import bip66 from 'bip66'
import BN from 'bn.js'

/**
 * @description
 * @param {String} signature derSig hex string
 */
export const parseDERsignature = signature => {
  let obj = {}
  const index = parseInt(signature.slice(0, 4))
  if (index === 3045) {
    if (signature.slice(7, 8) === '1') {
      obj.r = signature.slice(10, 74)
      obj.s = signature.slice(78)
    } else {
      obj.r = signature.slice(8, 72)
      obj.s = signature.slice(78)
    }
  } else if (index === 3046) {
    obj.r = signature.slice(10, 74)
    obj.s = signature.slice(80)
  } else {
    obj.r = signature.slice(8, 72)
    obj.s = signature.slice(76)
  }
  return obj
}

/**
 * @param {{r:string, s:string}}
 * @return 
 */
export const convertToDER = sig => {
  let r = Buffer.from(sig.r, 'hex')
  let s = Buffer.from(sig.s, 'hex')

  const canSBuffer = Buffer.from(s, 'hex')
  const canRBuffer = Buffer.from(r, 'hex')
  if (canSBuffer[0] & 0x80) {
    const buf = Buffer.alloc(1)
    const temp = Buffer.concat([buf, canSBuffer], canSBuffer.length + 1)
    s = temp
  }
  if (canRBuffer[0] & 0x80) {
    const buf = Buffer.alloc(1)
    const temp = Buffer.concat([buf, canRBuffer], canRBuffer.length + 1)
    r = temp
  }

  const derSignature = bip66.encode(r, s).toString('hex')
  return derSignature
}

export const getCanonicalSignature = signature => {
  let canonicalS, canonicalR
  const modulusString = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'
  const modulus = new BN(modulusString, 16)
  const s = new BN(signature.s, 16)
  const r = new BN(signature.r, 16)
  const T = modulus.sub(s)

  if (s.ucmp(T) < 0) {
    canonicalS = s.toString(16)
  } else {
    canonicalS = T.toString(16)
  }

  const slength = canonicalS.length % 2 === 0 ? canonicalS.length : canonicalS.length + 1
  canonicalS = canonicalS.padStart(slength, '0')
  let rBigNumber = r.toString(16)

  const rlength = rBigNumber.length % 2 === 0 ? rBigNumber.length : rBigNumber.length + 1
  canonicalR = rBigNumber.padStart(rlength, '0')

  const canonicalSignature = {
    r: canonicalR,
    s: canonicalS,
  }

  return canonicalSignature
}
