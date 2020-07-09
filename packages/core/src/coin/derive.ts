import { setting, apdu, crypto } from "../index";
import Transport from "../transport";
import { commands } from "../apdu/execute/command";

const bip32 = require("bip32");

const authGetKey = async (transport: Transport, appId: string, appPrivateKey: string) => {
  const { signature, forceUseSC } = await setting.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    commands.AUTH_EXT_KEY,
    undefined, undefined, undefined, undefined
  );
  return apdu.wallet.authGetExtendedKey(transport, signature, forceUseSC);
};

/**
 * Get account extend public key and chain code of a specific bip44 account node
 * @param {string} appPrivateKey
 * @param {String} coinSEType
 * @param {Number} accIndex The Index of account we want to fetch, in integer
 * @param {Boolean} authFirst whether we need to establish authentication
 * @returns {Promise<{accountIndex:String, accountPublicKey:String, accountChainCode:String}>}
 */
export const getAccountExtKey = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinSEType: string,
  accIndex: number,
  authFirst: boolean = true
): Promise<{ accountIndex: string; accountPublicKey: string; accountChainCode: string; }> => {
  if (authFirst) await authGetKey(transport, appId, appPrivateKey);

  let accIndexHex = accIndex.toString(16);
  if (accIndexHex.length % 2 > 0) accIndexHex = `0${accIndexHex}`;
  const response = await apdu.wallet.getAccountExtendedKey(
    transport,
    coinSEType,
    accIndexHex
  );
  const decryptedData = crypto.encryption.ECIESDec(appPrivateKey, response);
  if (!decryptedData) throw Error("Decryption Failed");

  const accBuf = Buffer.from(decryptedData, "hex");
  const publicKey = accBuf.slice(0, 33);
  const chainCode = accBuf.slice(33);

  return {
    accountIndex: accIndexHex,
    accountPublicKey: publicKey.toString("hex"),
    accountChainCode: chainCode.toString("hex"),
  };
};

/**
 * Get Ed25519 public key with provided account index.
 * @param {string} coinSEType
 * @param {number} accountIndex
 * @param {boolean} authFirst
 * @return {Promise<Buffer>}
 */
export const getEd25519PublicKey = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinSEType: string,
  accountIndex: number,
  protocol: string,
  authFirst: boolean = true
): Promise<string | undefined> => {
  if (authFirst) await authGetKey(transport, appId, appPrivateKey);

  const accIndexHex = accountIndex.toString(16).padStart(2, "0");
  const response = await apdu.wallet.getEd25519AccountPublicKey(
    transport,
    coinSEType,
    accIndexHex,
    protocol
  );
  const decryptedData = crypto.encryption.ECIESDec(appPrivateKey, response);
  return decryptedData;
};

/**
 * @description Derive an address's public key from a account node
 * @param {String} accountPublicKey
 * @param {String} chainCode
 * @param {Number} changeIndex
 * @param {Number} addressIndex
 */
export const derivePubKey = (
  accountPublicKey: string,
  chainCode: string,
  changeIndex = 0,
  addressIndex = 0
) => {
  const accountNode = bip32.fromPublicKey(
    Buffer.from(accountPublicKey, "hex"),
    Buffer.from(chainCode, "hex")
  );
  const changeNode = accountNode.derive(changeIndex);
  const addressNode = changeNode.derive(addressIndex);
  const publicKey = addressNode.publicKey.toString("hex");

  const parentPublicKey = changeNode.publicKey.toString("hex");
  const parentChainCode = changeNode.chainCode.toString("hex");

  return { publicKey, parentPublicKey, parentChainCode };
};
