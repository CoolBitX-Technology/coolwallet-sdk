import { genAtomSigFromSESig } from '../src/util/transactionUtil';

describe('genAtomSigFromSESig', () => {
  it('signature is always 64 bytes when r has a leading-zero byte', async () => {
    // r < 2^248: canonical r is 31 significant bytes → r32 = '00' + 31 bytes
    const canonicalSig = { r32: '00' + 'ab'.repeat(31), s32: 'cd'.repeat(32) };
    const sig = await genAtomSigFromSESig(canonicalSig);
    expect(Buffer.from(sig, 'base64').byteLength).toBe(64);
  });

  it('signature is always 64 bytes when s has a leading-zero byte', async () => {
    const canonicalSig = { r32: 'ab'.repeat(32), s32: '00' + 'cd'.repeat(31) };
    const sig = await genAtomSigFromSESig(canonicalSig);
    expect(Buffer.from(sig, 'base64').byteLength).toBe(64);
  });

  it('signature is always 64 bytes when both r and s have leading-zero bytes', async () => {
    const canonicalSig = { r32: '00' + 'ab'.repeat(31), s32: '00' + 'cd'.repeat(31) };
    const sig = await genAtomSigFromSESig(canonicalSig);
    expect(Buffer.from(sig, 'base64').byteLength).toBe(64);
  });

  it('signature is always 64 bytes for normal r and s values', async () => {
    const canonicalSig = { r32: 'ab'.repeat(32), s32: 'cd'.repeat(32) };
    const sig = await genAtomSigFromSESig(canonicalSig);
    expect(Buffer.from(sig, 'base64').byteLength).toBe(64);
  });
});
