import base58 from 'bs58';
import { isBase58Format } from '../src/utils/stringUtil';

describe('isBase58Format', () => {
  it('rejects a 64-char hex pubkey that happens to contain no "0" (CW-29159)', () => {
    const hexPubkeyWithoutZero = '823f917cc28dbcccb9877a6e915bdf87bb86a55f6684a782555e2833d6534581';
    expect(hexPubkeyWithoutZero).toHaveLength(64);
    expect(isBase58Format(hexPubkeyWithoutZero)).toBe(false);
  });

  it('accepts a valid 44-char base58 pubkey', () => {
    expect(isBase58Format('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
  });

  it('accepts a valid 43-char base58 pubkey', () => {
    expect(isBase58Format('So11111111111111111111111111111111111111112')).toBe(true);
  });

  it('accepts the System Program ID, whose leading zero bytes shrink it to 32 chars', () => {
    const systemProgramId = '1'.repeat(32);
    expect(base58.decode(systemProgramId)).toHaveLength(32);
    expect(isBase58Format(systemProgramId)).toBe(true);
  });

  it('rejects a base58-charset string that decodes to more than 32 bytes', () => {
    const tooLong = '1'.repeat(34);
    expect(base58.decode(tooLong)).toHaveLength(34);
    expect(isBase58Format(tooLong)).toBe(false);
  });

  it('rejects empty or undefined input', () => {
    expect(isBase58Format('')).toBe(false);
    expect(isBase58Format(undefined)).toBe(false);
  });
});
