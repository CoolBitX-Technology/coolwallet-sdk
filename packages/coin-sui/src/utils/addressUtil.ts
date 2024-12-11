import { coin, config, Transport, utils } from '@coolwallet/core';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export const PATH = `44'/784'/0'/0'/`;

export async function getPublicKey(
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number
): Promise<string> {
  const fullPath = utils.getFullPath({ pathString: `${PATH}${addressIndex}'`, pathType: config.PathType.SLIP0010 });
  const publicKey = await coin.getPublicKeyByPath(transport, appId, appPrivateKey, fullPath); // need to connect card
  return publicKey;
}

export function getSuiAddressByPublicKey(publicKey: string): string {
  const pblicKeyBase64 = Buffer.from(publicKey, 'hex').toString('base64');
  return new Ed25519PublicKey(pblicKeyBase64).toSuiAddress();
}