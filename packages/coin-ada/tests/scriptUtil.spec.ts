/* eslint-disable max-len */
import { getTokenInfoArgument, getChangeArgument, assertTokenTransferSupported } from '../src/utils/scriptUtil';
import { TOKEN_TYPE } from '../src/config/tokenType';
import type { TokenAsset } from '../src';

const CHANGE_ADDRESS =
  'addr1qydsrjhhedvcafgjc25j4vwrp9jtys6u3fk2sekjhh0kn9rd8wkhd8cw7uqxu5lh002qahuyznn24f6d9dxh2fekhepq7a6wsr';

// A change output carrying `count` distinct-policy tokens (short 3-byte name, mid-size amount).
const changeWithTokens = (count: number) => ({
  address: CHANGE_ADDRESS,
  amount: 49610837,
  assets: Array.from(
    { length: count },
    (_, i): TokenAsset => ({ policyId: (i + 16).toString(16).padStart(2, '0').repeat(28), assetName: '4d494e', amount: 123456 })
  ),
});

describe('getTokenInfoArgument: official token payloads', () => {
  // Locks the stored `payload` (what CoolBitX signs) to what the SDK actually rebuilds and sends to
  // the card as the ifSigned union. If these ever diverge, a valid signature would verify against
  // bytes that are never presented, silently downgrading the token to "@symbol".
  it.each(TOKEN_TYPE)('$symbol: stored payload equals the SDK-built token-info union', (token) => {
    const arg = getTokenInfoArgument({ ...token, amount: 0 });
    expect(arg.slice(0, 144)).toBe(token.payload); // first 72 bytes are the signed payload
    expect(arg.slice(144)).toBe(token.signature.padStart(144, '0')); // then the 72-byte signature slot
  });
});

describe('getChangeArgument: change value size limit', () => {
  // The change value blob is capped at 2048 bytes (the card's changeValue slot). Each distinct-policy
  // token costs ~40 bytes, so a change can carry ~50 such tokens; beyond that it overflows and is
  // rejected — the real limit for spending a UTXO holding many different tokens on this card.
  it('accepts a change carrying ~50 distinct-policy tokens', () => {
    expect(() => getChangeArgument(changeWithTokens(50))).not.toThrow();
  });

  it('throws when the change value exceeds 2048 bytes', () => {
    expect(() => getChangeArgument(changeWithTokens(55))).toThrow(/exceeds 2048 bytes/);
  });
});

describe('assertTokenTransferSupported', () => {
  const RECEIVE_ADDRESS =
    'addr1qyulu6ra4ennas49mn77n4cpxcy7862sdx25f4sw8ea5yh3yu4d4xk2aku478dgmuqmuk7s0eh96h63svdtv5qhquzvqu94v7k';
  const token: TokenAsset = {
    policyId: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6',
    assetName: '4d494e',
    amount: 123456,
  };

  it('accepts a normal token transfer output', () => {
    expect(() => assertTokenTransferSupported({ address: RECEIVE_ADDRESS, amount: 1200000, token })).not.toThrow();
  });

  it('rejects a Byron (legacy) receiver — it cannot hold native tokens', () => {
    const byron = 'Ae2tdPwUPEZ4YjgvykNpoFeYUxoyhNj2kg8KfKWN2FizsSpLUPv68MpTVDo';
    expect(() => assertTokenTransferSupported({ address: byron, amount: 1200000, token })).toThrow(/Byron/);
  });

  it('rejects a zero token amount', () => {
    expect(() =>
      assertTokenTransferSupported({ address: RECEIVE_ADDRESS, amount: 1200000, token: { ...token, amount: 0 } })
    ).toThrow(/greater than 0/);
  });

  it('rejects a token amount passed as an unsafe JS number', () => {
    // 2^53 is past Number.MAX_SAFE_INTEGER; such a value is already corrupted as a JS number.
    expect(() =>
      assertTokenTransferSupported({ address: RECEIVE_ADDRESS, amount: 1200000, token: { ...token, amount: 2 ** 53 } })
    ).toThrow(/safe integer/);
  });

  it('accepts a large token amount passed as a string (up to uint64)', () => {
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...token, amount: '18446744073709551615' }, // 2^64 - 1
      })
    ).not.toThrow();
  });

  it('rejects a token amount above uint64 max (2^64)', () => {
    // A Cardano quantity caps at 2^64-1; one byte more also overflows the card's 8-byte amount slot.
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...token, amount: '18446744073709551616' }, // 2^64
      })
    ).toThrow(/2\^64/);
  });

  it('rejects a policyId that is not 28 bytes hex', () => {
    expect(() =>
      assertTokenTransferSupported({ address: RECEIVE_ADDRESS, amount: 1200000, token: { ...token, policyId: 'ab' } })
    ).toThrow(/policyId must be 28 bytes/);
  });

  it('rejects an assetName longer than 32 bytes', () => {
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...token, assetName: 'ab'.repeat(33) },
      })
    ).toThrow(/at most 32 bytes/);
  });

  // symbol/decimals bounds only bite for an unofficial token; an official one takes its metadata from
  // the trusted list, so use a non-official policyId to exercise the caller-supplied values.
  const unofficial: TokenAsset = { policyId: '11'.repeat(28), assetName: 'ab', amount: 1, symbol: 'X', decimals: 0 };

  it('rejects an empty symbol (the card symbol-length slot is 1..7)', () => {
    expect(() =>
      assertTokenTransferSupported({ address: RECEIVE_ADDRESS, amount: 1200000, token: { ...unofficial, symbol: '' } })
    ).toThrow(/1 to 7 bytes/);
  });

  it('accepts decimals at the on-card upper bound (20)', () => {
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...unofficial, decimals: 20 },
      })
    ).not.toThrow();
  });

  it('rejects decimals above 20, or >= 256 (which would overflow the 1-byte field)', () => {
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...unofficial, decimals: 21 },
      })
    ).toThrow(/between 0 and 20/);
    expect(() =>
      assertTokenTransferSupported({
        address: RECEIVE_ADDRESS,
        amount: 1200000,
        token: { ...unofficial, decimals: 256 },
      })
    ).toThrow(/between 0 and 20/);
  });
});

describe('getTokenInfoArgument: asset name encoding', () => {
  const base = { policyId: '11'.repeat(28), symbol: 'X', decimals: 0, amount: 1 };

  it('encodes a 32-byte asset name with a 2-byte CBOR header, filling the slot exactly', () => {
    const arg = getTokenInfoArgument({ ...base, assetName: 'ab'.repeat(32) });
    expect(arg.length).toBe(288); // 72-byte payload + 72-byte signature slot, in hex
    expect(arg).toContain('5820' + 'ab'.repeat(32)); // 0x58 0x20 = 32-byte byte-string header
  });
});
