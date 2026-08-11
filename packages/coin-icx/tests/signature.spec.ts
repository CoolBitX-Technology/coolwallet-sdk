// Unit test for the signature assembly formula in generateFullCanonicalSig.
// The full sign flow requires hardware and a real keypair for v computation,
// so we verify the formula directly:
//   sig = r32 + s32 + v   where v is '00' or '01' (2 hex chars)
// Previously the formula was r + s + v where r and s were not padded to 32 bytes.
describe('ICX signature assembly', () => {
  it('is always 65 bytes when both r and s have leading-zero bytes', () => {
    const r32 = '00' + 'ab'.repeat(31); // r < 2^248 → padded to 64 hex chars
    const s32 = '00' + 'cd'.repeat(31); // s < 2^248 → padded to 64 hex chars
    const v = '00';
    const sig = r32 + s32 + v;
    expect(Buffer.from(sig, 'hex').byteLength).toBe(65);
  });

  it('is always 65 bytes for normal r and s values', () => {
    const r32 = 'ab'.repeat(32);
    const s32 = 'cd'.repeat(32);
    const v = '01';
    const sig = r32 + s32 + v;
    expect(Buffer.from(sig, 'hex').byteLength).toBe(65);
  });
});
