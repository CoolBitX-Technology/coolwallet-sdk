declare module 'bip66' {
  function decode(signature: Buffer): { r: Buffer; s: Buffer };
  function encode(r: Buffer, s: Buffer): any;
}
