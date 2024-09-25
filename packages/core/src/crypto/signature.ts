import bip66 from 'bip66';
import BN from 'bn.js';

/**
 * @description
 * @param {String} signature derSig hex string
 */
export const parseDERsignature = (signature: string) => {
  const decoded = bip66.decode(Buffer.from(signature, 'hex'));
  const obj = {
    r: decoded.r.toString('hex'),
    s: decoded.s.toString('hex'),
  };
  return obj;
};

/**
 * @param {{r:string, s:string}}
 * @return {Buffer}
 */
export const convertToDER = (sig: { r: string; s: string }): { r: string; s: string } => {
  let canRBuffer = Buffer.from(sig.r, 'hex');
  let canSBuffer = Buffer.from(sig.s, 'hex');

  // eslint-disable-next-line no-bitwise
  if (canSBuffer[0] & 0x80) {
    const buf = Buffer.alloc(1);
    const temp = Buffer.concat([buf, canSBuffer], canSBuffer.length + 1);
    canSBuffer = temp;
  }
  // eslint-disable-next-line no-bitwise
  if (canRBuffer[0] & 0x80) {
    const buf = Buffer.alloc(1);
    const temp = Buffer.concat([buf, canRBuffer], canRBuffer.length + 1);
    canRBuffer = temp;
  }

  const derSignature = bip66.encode(canRBuffer, canSBuffer);
  return derSignature;
};

export const getCanonicalSignature = (signature: { s?: any; r?: any }) => {
  const modulusString = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141';
  const modulus = new BN(modulusString, 16);
  const s = new BN(signature.s, 16);
  const r = new BN(signature.r, 16);
  const t = modulus.sub(s);

  // bigNumber will cause s.length changed, so we need to pad it to 64 (string length which is equal to 32 bytes)
  let canonicalS;
  if (s.ucmp(t) < 0) {
    canonicalS = s.toString(16);
  } else {
    canonicalS = t.toString(16);
  }

  canonicalS = canonicalS.padStart(64, '0');
  const rBigNumber = r.toString(16);

  const canonicalR = rBigNumber.padStart(64, '0');

  const canonicalSignature = {
    r: canonicalR,
    s: canonicalS,
  };

  return canonicalSignature;
};
