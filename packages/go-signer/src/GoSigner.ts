import { coin, info, Transport } from '@coolwallet/core';
import { EcdsaSignature, EddsaSignature, GoSignerOptions, SchnorrSignature, SignCurve, SignDataResult } from './types';

/**
 * Blind signing on CoolWallet Go signing-only firmware (SE version >= 100).
 * The card has no display: whatever digest / message is passed in gets signed.
 *
 * Paths use the SDK hex format `[pathType 1B][index 4B]...` (at most 5 indices), e.g. the output of utils.getFullPath.
 * Data and results are hex strings; validation and result formatting are done by core's coin.signData.
 */
export default class GoSigner {
  private transport: Transport;

  private appId: string;

  private appPrivateKey: string;

  constructor(transport: Transport, options: GoSignerOptions) {
    this.transport = transport;
    this.appId = options.appId;
    this.appPrivateKey = options.appPrivateKey;
  }

  /**
   * Whether the connected card is a Go card running the signing-only firmware.
   * Throws when the SE version cannot be read, rather than reporting old firmware.
   */
  async isSupported(): Promise<boolean> {
    return info.isSigningOnlyFirmware(this.transport);
  }

  /** ECDSA secp256k1 over a 32-byte digest, with a BIP32 path (pathType 32). Low-S, no recovery id. */
  async signSecp256k1(path: string, digest: string): Promise<EcdsaSignature> {
    return this.sign(SignCurve.SECP256K1, path, digest);
  }

  /**
   * BIP-340 Schnorr over a 32-byte digest.
   * The card applies the BIP-86 taproot tweak only for a BIP340 path (pathType 34) with exactly 5 indices;
   * other BIP340 depths and BIP32 paths (pathType 32) sign with the untweaked key.
   */
  async signSchnorr(path: string, digest: string): Promise<SchnorrSignature> {
    return this.sign(SignCurve.SCHNORR, path, digest);
  }

  /** Ed25519 over the raw message, with a SLIP-0010 (pathType 10) or BIP32-EdDSA (pathType 42) path. */
  async signEd25519(path: string, message: string): Promise<EddsaSignature> {
    return this.sign(SignCurve.ED25519, path, message);
  }

  /** BIP32-Ed25519 (Cardano) over the raw message, with a BIP32-Ed25519 path (pathType 17). */
  async signBip32Ed25519(path: string, message: string): Promise<EddsaSignature> {
    return this.sign(SignCurve.BIP32ED25519, path, message);
  }

  private sign<C extends SignCurve>(curve: C, path: string, data: string): Promise<SignDataResult<C>> {
    return coin.signData({
      transport: this.transport,
      appId: this.appId,
      appPrivateKey: this.appPrivateKey,
      path,
      curve,
      data,
    });
  }
}
