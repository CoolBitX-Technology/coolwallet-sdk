export interface TinySecp256k1Interface {
  isXOnlyPoint(p: Uint8Array): boolean;
  xOnlyPointAddTweak(p: Uint8Array, tweak: Uint8Array): XOnlyPointAddTweakResult | null;
}

export interface XOnlyPointAddTweakResult {
  parity: 1 | 0;
  xOnlyPubkey: Uint8Array;
}

const _ECCLIB_CACHE: { eccLib?: TinySecp256k1Interface } = {};

export function initEccLib(eccLib: TinySecp256k1Interface | undefined): void {
  if (!eccLib) {
    // allow clearing the library
    _ECCLIB_CACHE.eccLib = eccLib;
  } else if (eccLib !== _ECCLIB_CACHE.eccLib) {
    _ECCLIB_CACHE.eccLib = eccLib;
  }
}

export function getEccLib(): TinySecp256k1Interface {
  if (!_ECCLIB_CACHE.eccLib)
    throw new Error('No ECC Library provided. You must call initEccLib() with a valid TinySecp256k1Interface instance');
  return _ECCLIB_CACHE.eccLib;
}
