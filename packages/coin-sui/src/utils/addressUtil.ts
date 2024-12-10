import { coin, config, Transport, utils } from '@coolwallet/core';

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
