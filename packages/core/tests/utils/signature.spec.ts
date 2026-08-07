import { getCanonicalSignature } from '../../src/crypto/signature';

describe('getCanonicalSignature', () => {
  it('r32 is always 64 hex chars when r has a leading-zero byte', () => {
    // r < 2^248 means the highest byte is 0x00 → previously dropped, causing a 63-byte r
    const r = '00' + 'ab'.repeat(31);
    const s = 'cd'.repeat(32);
    const result = getCanonicalSignature({ r, s });

    expect(result.r32).toHaveLength(64);
    expect(result.r32.startsWith('00')).toBe(true);
  });

  it('r32 is always 64 hex chars for a normal r value', () => {
    const r = 'ab'.repeat(32);
    const s = 'cd'.repeat(32);
    const result = getCanonicalSignature({ r, s });

    expect(result.r32).toHaveLength(64);
  });

  it('s32 is always 64 hex chars when s has a leading-zero byte', () => {
    const r = 'ab'.repeat(32);
    const s = '00' + 'cd'.repeat(31);
    const result = getCanonicalSignature({ r, s });

    expect(result.s32).toHaveLength(64);
    expect(result.s32.startsWith('00')).toBe(true);
  });

  it('preserves existing r, s, s32 fields for backward compatibility', () => {
    const r = 'ab'.repeat(32);
    const s = 'cd'.repeat(32);
    const result = getCanonicalSignature({ r, s });

    expect(result).toHaveProperty('r');
    expect(result).toHaveProperty('s');
    expect(result).toHaveProperty('s32');
    expect(result).toHaveProperty('r32');
  });

  it('r32 and s32 are both 64 hex chars regardless of leading-zero bytes', () => {
    const r = '00' + 'ef'.repeat(31);
    const s = '00' + '12'.repeat(31);
    const result = getCanonicalSignature({ r, s });

    expect(result.r32).toHaveLength(64);
    expect(result.s32).toHaveLength(64);
  });
});
