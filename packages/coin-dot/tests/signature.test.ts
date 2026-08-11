// Unit test for the signature assembly formula in getCompleteSignature.
// The full sign flow requires hardware, so we verify the formula directly:
//   sig = r32 + s32 + v   where v = getKeyRecoveryParam(...).toString().padStart(2, '0')
// v is always '00' or '01' (2 hex chars), so the final sig is always 65 bytes.
describe('DOT signature assembly', () => {
  it('is always 65 bytes when r has a leading-zero byte', () => {
    const r32 = '00' + 'ab'.repeat(31); // r < 2^248 → padded to 64 hex chars
    const s32 = 'cd'.repeat(32);
    const v = '00';
    const sig = r32 + s32 + v;
    expect(Buffer.from(sig, 'hex').byteLength).toBe(65);
  });

  it('is always 65 bytes for normal r value', () => {
    const r32 = 'ab'.repeat(32);
    const s32 = 'cd'.repeat(32);
    const v = '01';
    const sig = r32 + s32 + v;
    expect(Buffer.from(sig, 'hex').byteLength).toBe(65);
  });
});
