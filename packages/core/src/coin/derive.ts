import { setting, apdu, crypto } from '../index';
import Transport from '../transport';
import { commands } from '../apdu/execute/command';

const bip32 = require('bip32');

const authGetKey = async (transport: Transport, appId: string, appPrivateKey: string) => {
  const signature = await setting.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    commands.AUTH_EXT_KEY
  );
  return apdu.wallet.authGetExtendedKey(transport, signature);
};

/**
 * Get extend public key of a specific bip44 account node
 */
export const getAccountExtKeyFromSE = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  path: string,
  authFirst = true
): Promise<string> => {
  if (authFirst) await authGetKey(transport, appId, appPrivateKey);
  const response = await apdu.wallet.getAccountExtendedKey(transport, path);
  const decryptedData = crypto.encryption.ECIESDec(appPrivateKey, response);
  if (!decryptedData) throw Error('Decryption Failed');
  return decryptedData;
};

/**
 * Derive an address's public key from a account node
 */
export const derivePubKey = (
  accountPublicKey: string,
  chainCode: string,
  changeIndex = 0,
  addressIndex = 0
): { publicKey:string, parentPublicKey:string, parentChainCode:string } => {
  const accountNode = bip32.fromPublicKey(
    Buffer.from(accountPublicKey, 'hex'),
    Buffer.from(chainCode, 'hex')
  );
  const changeNode = accountNode.derive(changeIndex);
  const addressNode = changeNode.derive(addressIndex);
  const publicKey = addressNode.publicKey.toString('hex');

  const parentPublicKey = changeNode.publicKey.toString('hex');
  const parentChainCode = changeNode.chainCode.toString('hex');

  return { publicKey, parentPublicKey, parentChainCode };
};
