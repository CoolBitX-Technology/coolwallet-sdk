/* eslint-disable max-len */
import { CardType, error, info } from '@coolwallet/core';
import * as params from '../config/params';

/**
 * Asserts that a Go card's SE version runs the ZEC script. Go SE 100 and later is signing-only firmware, which runs no
 * scripts, so such a card signs with @coolwallet/go-signer instead.
 */
export function assertGoSeVersionSupportsZecScript(cardType: CardType, seVersion: number): void {
  if (cardType === CardType.Go && seVersion >= info.GO_SIGNING_ONLY_SE_VERSION) {
    throw new error.SDKError(
      assertGoSeVersionSupportsZecScript.name,
      'CoolWallet Go with signing-only firmware cannot run scripts; use @coolwallet/go-signer instead of @coolwallet/zec'
    );
  }
}

/**
 * Whether to sign v5. Only a Pro SE 348 or later runs the v5 script's UTXO section, so a Go card and an older Pro sign
 * v4; any other card type signs v5.
 */
export function shouldSignV5(cardType: CardType, seVersion: number): boolean {
  if (cardType === CardType.Go) {
    return false;
  }
  if (cardType === CardType.Pro) {
    return seVersion >= params.ZEC_V5_MIN_SE_VERSION;
  }
  return true;
}
