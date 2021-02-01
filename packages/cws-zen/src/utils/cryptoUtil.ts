const zencashjs = require('zencashjs')

export function hash160(buf: Buffer): Buffer {
  return Buffer.from(zencashjs.crypto.hash160(buf), 'hex');
}

export function doubleSha256(buf: Buffer): Buffer {

  return Buffer.from(zencashjs.crypto.sha256x2(buf), 'hex');
}
