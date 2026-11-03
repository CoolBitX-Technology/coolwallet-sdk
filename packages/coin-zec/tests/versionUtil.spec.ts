import { CardType } from '@coolwallet/core';
import { assertGoSeVersionSupportsZecScript, shouldSignV5 } from '../src/utils/versionUtil';

describe('assertGoSeVersionSupportsZecScript', () => {
  // Go SE versions are decimal: below 100 runs scripts, 100 and up is signing-only
  it.each`
    cardType        | seVersion
    ${CardType.Go}  | ${99}
    ${CardType.Pro} | ${348}
  `('passes for $cardType SE $seVersion', ({ cardType, seVersion }) => {
    expect(() => assertGoSeVersionSupportsZecScript(cardType, seVersion)).not.toThrow();
  });

  it.each`
    seVersion
    ${100}
    ${101}
  `('throws for Go signing-only SE $seVersion', ({ seVersion }) => {
    expect(() => assertGoSeVersionSupportsZecScript(CardType.Go, seVersion)).toThrow('use @coolwallet/go-signer');
  });
});

describe('shouldSignV5', () => {
  describe('Pro card', () => {
    it.each`
      seVersion | expected
      ${347}    | ${false}
      ${348}    | ${true}
      ${349}    | ${true}
    `('returns $expected for SE $seVersion', ({ seVersion, expected }) => {
      expect(shouldSignV5(CardType.Pro, seVersion)).toBe(expected);
    });
  });

  describe('Go card that runs scripts', () => {
    it.each`
      seVersion
      ${1}
      ${99}
    `('signs v4 for SE $seVersion', ({ seVersion }) => {
      expect(shouldSignV5(CardType.Go, seVersion)).toBe(false);
    });
  });

  // a card type added to core after this was written
  describe('unknown card type', () => {
    it.each`
      seVersion
      ${1}
      ${347}
      ${348}
    `('signs v5 for SE $seVersion', ({ seVersion }) => {
      expect(shouldSignV5('Future' as CardType, seVersion)).toBe(true);
    });
  });
});
