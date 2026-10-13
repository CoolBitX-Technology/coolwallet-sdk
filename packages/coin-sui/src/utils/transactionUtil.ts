import BigNumber from 'bignumber.js';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export function getKeyPair(mnemonic: string, addressIndex: number): Ed25519Keypair {
  return Ed25519Keypair.deriveKeypair(mnemonic, `m/44'/784'/0'/0'/${addressIndex}'`);
}

export function convertToUnitAmount(humanAmount: string, decmials: number): string {
  return new BigNumber(humanAmount).shiftedBy(decmials).toFixed();
}

export function getBase64Signature(signature: Buffer, publicKey: string): string {
  const signatureHex = signature.toString('hex');
  const eddsaType = '00';
  const signedTx = eddsaType + signatureHex + publicKey;
  return Buffer.from(signedTx, 'hex').toString('base64');
}
