/* eslint-disable max-len */
// Pure-function tests for the multi-asset CBOR encoding — no card / transport needed,
// so these run in plain CI and lock down the canonical ordering that the on-chain node
// (and the card signature, which is over these exact bytes) depends on.
import { buildMultiAssetCbor, encodeOutputValue } from '../src/utils/transactionUtil';
import type { TokenAsset } from '../src';

const MELD = '6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10'; // starts 0x6a
const MIN = '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6'; // starts 0x29

describe('buildMultiAssetCbor canonical ordering', () => {
  it('produces the same bytes regardless of input order (canonicalizes)', () => {
    const assets: TokenAsset[] = [
      { policyId: MELD, assetName: '4d454c44', amount: 251 },
      { policyId: MIN, assetName: '4d494e', amount: 123456 },
      { policyId: MIN, assetName: '00', amount: 5 },
    ];
    const reference = buildMultiAssetCbor(assets);
    const shuffled: TokenAsset[][] = [
      [...assets].reverse(),
      [assets[1], assets[2], assets[0]],
      [assets[2], assets[0], assets[1]],
    ];
    for (const order of shuffled) {
      expect(buildMultiAssetCbor(order)).toBe(reference);
    }
  });

  it('orders policies by decoded byte value, not by hex-string case', () => {
    // lo decodes to a byte (0xa0) that is LESS than hi (0xb0), so lo must come first.
    // A naive string sort would invert this: 'B' (0x42) < 'a' (0x61) in ASCII.
    const lo = 'a0' + '0'.repeat(54);
    const hi = 'B0' + '0'.repeat(54);
    const out = buildMultiAssetCbor([
      { policyId: hi, assetName: '', amount: 1 },
      { policyId: lo, assetName: '', amount: 2 },
    ]);
    expect(out.indexOf('581c' + lo)).toBeLessThan(out.indexOf('581c' + hi));
  });

  it('orders asset names by byte length first, then bytewise', () => {
    // 'ff' is 1 byte, '0000' is 2 bytes. Length-first puts 'ff' before '0000', even though
    // a pure bytewise compare of the name bytes would put '0000' (0x00..) first.
    const out = buildMultiAssetCbor([
      { policyId: MELD, assetName: '0000', amount: 1 },
      { policyId: MELD, assetName: 'ff', amount: 1 },
    ]);
    expect(out.indexOf('41ff')).toBeLessThan(out.indexOf('420000'));
  });

  it('pins the exact canonical bytes for a two-policy bundle', () => {
    expect(
      buildMultiAssetCbor([
        { policyId: MELD, assetName: '4d454c44', amount: 251 },
        { policyId: MIN, assetName: '4d494e', amount: 123456 },
      ])
    ).toMatchInlineSnapshot(
      `"a2581c29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6a1434d494e1a0001e240581c6ac8ef33b510ec004fe11585f7c5a9f0c07f0c23428ab4f29c1d7d10a1444d454c4418fb"`
    );
  });
});

describe('encodeOutputValue', () => {
  it('encodes an ADA-only value as a bare uint', () => {
    expect(encodeOutputValue(5)).toBe('05');
    expect(encodeOutputValue(5, [])).toBe('05');
  });

  it('wraps [coin, multiasset] when assets are present', () => {
    const assets: TokenAsset[] = [{ policyId: MELD, assetName: '4d454c44', amount: 251 }];
    expect(encodeOutputValue(5, assets)).toBe('82' + '05' + buildMultiAssetCbor(assets));
  });
});
