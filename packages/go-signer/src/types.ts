import { coin } from '@coolwallet/core';

// Curves and result formats come from core (coin.signData) so the two packages never drift apart.
export const SignCurve = coin.SignCurve;
export type SignCurve = coin.SignCurve;

export type EcdsaSignature = coin.EcdsaSignature;
export type EddsaSignature = coin.EddsaSignature;
export type SchnorrSignature = coin.SchnorrSignature;
export type SignDataResult<C extends SignCurve = SignCurve> = coin.SignDataResult<C>;

export type GoSignerOptions = {
  appId: string;
  appPrivateKey: string;
};
