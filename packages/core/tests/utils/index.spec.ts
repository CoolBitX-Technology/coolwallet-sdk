import { createSeedsHexByMnemonic, getReturnMsg } from '../../src/utils';
import { CardType } from '../../src/transport';

describe('getReturnMsg', () => {
  it('uses legacy messages when the card version is not given', () => {
    expect(getReturnMsg('609D')).toBe('appid need registered');
    expect(getReturnMsg('6A01')).toBe('unsupported script command');
  });

  it.each([
    [CardType.Pro, 346],
    [CardType.Pro, 0],
    [CardType.Go, 100],
    [CardType.Go, 0],
  ])('uses legacy messages for %s SE %d', (cardType, seVersion) => {
    expect(getReturnMsg('6A01', cardType, seVersion)).toBe('unsupported script command');
    expect(getReturnMsg('6903', cardType, seVersion)).toBe('unknown command error');
  });

  it('uses renumbered messages for Pro SE >= 347', () => {
    expect(getReturnMsg('6903', CardType.Pro, 347)).toBe('appid need registered');
    expect(getReturnMsg('6A01', CardType.Pro, 347)).toBe('script signature verification failed');
    expect(getReturnMsg('6915', CardType.Pro, 348)).toBe('old pair password is wrong');
    expect(getReturnMsg('609D', CardType.Pro, 347)).toBe('unknown command error');
  });

  it('uses renumbered messages for Go SE >= 101', () => {
    expect(getReturnMsg('6903', CardType.Go, 101)).toBe('appid need registered');
    expect(getReturnMsg('6D12', CardType.Go, 101)).toBe('path length is incorrect in Bip32.java');
    expect(getReturnMsg('609D', CardType.Go, 101)).toBe('unknown command error');
  });

  it('shares ISO status words across versions', () => {
    expect(getReturnMsg('6A86')).toBe('incorrect p1 & p2');
    expect(getReturnMsg('6A86', CardType.Pro, 347)).toBe('incorrect p1 & p2');
  });
});

describe('utils', () => {
  test('createSeedsHexByMnemonic', async () => {
    const mnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo card';
    const seedsHex = await createSeedsHexByMnemonic(mnemonic);
    expect(seedsHex).toMatchInlineSnapshot(
      `"c52efd54460e2acb9dc560ee868dbc4be74da82aca8f7d7f806ecf1a47183f140d16aad1fac199ad9934b6659556a69ec63be60df25a89f16d103445b8440d6360bc741dba717e0ea991ba26210e6a1efc05c8e8a33eff0119b1a66e81c3a35337895fa1129f4f792cbe40c8de33478a24cd2b7688fe1de81341135263017f694d3b0f11600fe4b9fff8f77ff5853d9e1fe2ba80909328d4ff65d7246804112c"`
    );
  });
});
