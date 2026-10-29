/* eslint-disable max-len */
import { CardType, error, info } from '@coolwallet/core';
import * as params from '../config/params';

/**
 * Throws for a CoolWallet Go on signing-only firmware: it has no script engine, so it signs with
 * @coolwallet/go-signer instead.
 */
export function assertRunsScripts(cardType: CardType, seVersion: number): void {
  if (cardType === CardType.Go && seVersion >= info.GO_SIGNING_ONLY_SE_VERSION) {
    throw new error.SDKError(
      assertRunsScripts.name,
      'CoolWallet Go with signing-only firmware cannot run scripts; use @coolwallet/go-signer instead of @coolwallet/zec'
    );
  }
}

/**
 * Whether to sign v5. Only a Pro SE 348 or later runs the v5 script's UTXO section; Go firmware has none, so a Go card
 * that runs scripts keeps signing v4 (one on signing-only firmware is rejected by assertRunsScripts). Any other card
 * type signs v5, so a card type added later needs no change here.
 */
export function shouldSignV5(cardType: CardType, seVersion: number): boolean {
  if (cardType === CardType.Go) {
    return false;
  }
  if (cardType === CardType.Pro) {
    // A Pro SE always reports its version, so 0 (or NaN) means the query failed: sign v5 then, since v4 is rejected once NU7 activates.
    if (!(seVersion > 0)) {
      return true;
    }
    return seVersion >= params.ZEC_V5_MIN_SE_VERSION;
  }
  return true;
}
