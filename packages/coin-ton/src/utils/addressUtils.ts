import { Transport, coin, config, utils } from '@coolwallet/core';
import { getWalletV4R2 } from './tonweb';

export async function getAddressByPublicKey(publicKey: string, isBounceable: boolean = false): Promise<string> {
  const wallet = getWalletV4R2(publicKey);

  const address = await wallet.getAddress();

  const isUserFriendly = true;
  const isUrlSafe = true;
  const friendlyAddress = address.toString(isUserFriendly, isUrlSafe, isBounceable);

  return friendlyAddress;
}

export async function getPublicKey(
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number
): Promise<string> {
  const fullPath = utils.getFullPath({ pathString: `44'/607'/${addressIndex}'`, pathType: config.PathType.SLIP0010 });
  const publicKey = await coin.getPublicKeyByPath(transport, appId, appPrivateKey, fullPath); // need to connect card
  return publicKey;
}
