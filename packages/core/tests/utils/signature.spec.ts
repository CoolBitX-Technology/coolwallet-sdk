import { getCanonicalSignature, convertToDER } from '../../src/crypto/signature';
import { formatSignature } from '../../src/transaction/util';
import { SignatureType } from '../../src/transaction/type';

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

describe('formatSignature — Canonical end-to-end', () => {
  it('r32 survives the DER parse → canonicalize pipeline when r has a leading-zero byte', () => {
    // r is 31 significant bytes (< 2^248). convertToDER adds the DER 0x00 high-bit prefix,
    // so parseDERsignature gives back 31 bytes; without the r32 fix this produced a 62-char r.
    const r = 'ab'.repeat(31); // 31 bytes, first byte 0xab (high bit set → DER prepends 0x00)
    const s = '12'.repeat(32);

    const derHex = convertToDER({ r, s }).toString('hex');
    const result = formatSignature(derHex, SignatureType.Canonical);

    expect(Buffer.isBuffer(result)).toBe(false);
    if (!Buffer.isBuffer(result)) {
      expect(result.r32).toHaveLength(64);
      expect(result.r32.startsWith('00')).toBe(true);
    }
  });
});
