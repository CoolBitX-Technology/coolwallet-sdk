import { sign } from "../crypto/sign";
import { aes256CbcDecrypt } from "../crypto/encryptions";
import * as signatureTools from "../crypto/signature";
import COMMAND from "../config/command";
import * as apdu from "../apdu/index";
import { getCommandSignature } from "./auth";
import Transport from "../transport";

/**
 * get command signature for CoolWalletS
 * @param {String} txDataHex hex string data for SE
 * @param {String} txDataType hex P1 string
 * @param {String} appPrivateKey
 * @return {String} signature
 */
const signForCoolWallet = (txDataHex: string, txDataType: string, appPrivateKey: string) => {
  const command = COMMAND.TX_PREPARE;
  const P1 = txDataType;
  const P2 = "00";
  const prefix = command.CLA + command.INS + P1 + P2;
  const payload = prefix + txDataHex;
  const signatureBuffer = sign(Buffer.from(payload, "hex"), appPrivateKey);
  return signatureBuffer.toString("hex");
};

export const getEncryptedSignatureByScripts = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  script: string,
  argument: string,
  txPrepareComplteCallback: Function | undefined = undefined
) => {
  await apdu.tx.sendScript(transport, script);
  const { signature } = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    "EXECUTE_SCRIPT",
    argument,
    undefined,
    undefined
  );
  const encryptedSignature = await apdu.tx.executeScript(
    transport,
    argument,
    signature
  );
  await apdu.tx.finishPrepare(transport);

  if (typeof txPrepareComplteCallback === "function")
    txPrepareComplteCallback();
  return encryptedSignature;
};

/**
 * send output data for bitcoin family
 * @param {Transport} transport
 * @param {String} txDataHex hex string data for SE
 * @param {String} txDataType hex P1 string
 */
export const prepareOutputData = async (transport: Transport, txDataHex: string, txDataType: string) => {
  await apdu.tx.prepTx(transport, txDataHex, txDataType, "00");
};

/**
 * get command signature for CoolWalletS
 * @param {Transport} transport
 * @param {String} txDataHex hex string data for SE
 * @param {String} txDataType hex P1 string
 * @param {String} appPrivateKey
 * @return {String} signature
 */
export const prepareTx = async (
  transport: Transport,
  txDataHex: string,
  txDataType: string,
  appPrivateKey: string
) => {
  let encryptedSignature;
  const sendData =
    txDataHex + signForCoolWallet(txDataHex, txDataType, appPrivateKey);
  const patch = Math.ceil(sendData.length / 500);
  for (let i = 0; i < patch; i++) {
    const patchData = sendData.substr(i * 500, 500);
    const p2 = patch === 1 ? "00" : (i === patch - 1 ? "8" : "0") + (i + 1);
    // eslint-disable-next-line no-await-in-loop
    encryptedSignature = await apdu.tx.prepTx(
      transport,
      patchData,
      txDataType,
      p2
    );
  }
  return encryptedSignature;
};

/**
 * do TX_PREP and get encrypted signature.
 * @param {Transport} transport
 * @param {String} txDataHex
 * @param {String} txDataType
 * @param {String} appPrivateKey
 * @param {Function} txPrepareCompleteCallback
 * @returns {Promise<String>} encryptedSignature
 */
export const getSingleEncryptedSignature = async (
  transport: Transport,
  txDataHex: string,
  txDataType: string,
  appPrivateKey: string,
  txPrepareCompleteCallback: Function | undefined = undefined
) => {
  const encryptedSignature = await prepareTx(
    transport,
    txDataHex,
    txDataType,
    appPrivateKey
  );
  await apdu.tx.finishPrepare(transport);
  if (typeof txPrepareCompleteCallback === "function")
    txPrepareCompleteCallback();
  return encryptedSignature;
};

/**
 * Same as getSingleEncryptedSignature, but used for UTXO based coins to get array of sigs.
 * @param {Transport} transport
 * @param {Array<{Function}>} preActions
 * @param {Array<{Function}>} actions
 * @param {Function} txPrepareCompleteCallback
 * @returns {Promise<Array<String>>} array of encryptedSignature
 */
export const getEncryptedSignatures = async (
  transport: Transport,
  preActions: Array<Function>,
  actions: Array<Function>,
  txPrepareCompleteCallback: Function | undefined = undefined
) => {
  // eslint-disable-next-line no-await-in-loop
  for (const preAction of preActions) await preAction();
  const encryptedSignatureArray = [];
  // eslint-disable-next-line no-await-in-loop
  for (const action of actions) encryptedSignatureArray.push(await action());
  await apdu.tx.finishPrepare(transport);
  if (typeof txPrepareCompleteCallback === "function")
    txPrepareCompleteCallback();
  return encryptedSignatureArray;
};

/**
 * get the key used to encrypt signatures
 * @param {Transport} transport
 * @param {Function} authorizedCallback
 * @returns {Promise<String>}
 */
export const getCWSEncryptionKey = async (transport: Transport, authorizedCallback: Function | undefined) => {
  const success = await apdu.tx.getTxDetail(transport);
  if (!success) return undefined;

  if (typeof authorizedCallback === "function") authorizedCallback();

  const signatureKey = await apdu.tx.getSignatureKey(transport);

  await apdu.tx.clearTransaction(transport);
  await apdu.control.powerOff(transport);
  return signatureKey;
};

/**
 * @description Decrypt Data from CoolWallet
 * @param {String} encryptedSignature
 * @param {String} signatureKey
 * @param {Boolean} isEDDSA
 * @param {Boolean} returnCanonical
 * @return {{r:string, s:string} | Buffer } canonical or DER signature
 */
export const decryptSignatureFromSE = (
  encryptedSignature: string,
  signatureKey: string,
  isEDDSA: boolean = false,
  returnCanonical: boolean = true
) => {
  const iv = Buffer.alloc(16);
  iv.fill(0);
  const derSigBuff = aes256CbcDecrypt(
    iv,
    Buffer.from(signatureKey, "hex"),
    encryptedSignature
  );

  if (isEDDSA) return derSigBuff;

  const sigObj = signatureTools.parseDERsignature(derSigBuff.toString("hex"));
  const canonicalSignature = signatureTools.getCanonicalSignature(sigObj);
  if (returnCanonical) return canonicalSignature;

  return signatureTools.convertToDER(canonicalSignature);
};

/**
 * @param {String} coinType
 * @param {String} addressIndex
 */
export const addressIndexToKeyId = (coinType: string, addressIndex: number) => {
  const indexHex = addressIndex.toString(16).padStart(4, "0");
  const keyId = `${coinType}0000${indexHex}`;
  return keyId;
};
