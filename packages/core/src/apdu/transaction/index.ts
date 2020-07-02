import { executeCommand } from '../execute/execute';
import { getCommandSignature, getCommandSignatureWithoutNonce } from "../../setting/auth";
import Transport from '../../transport';
import { addressIndexToKeyId } from './txUtil'
import { commands } from "../execute/command";
import { SDKError, APDUError } from '../../error/errorHandle';
import { CODE } from '../config/status/code';
import { target } from '../config/target';


/**
 * Set change address's path to CoolWallet.
 * 
 * @param transport 
 * @param appId 
 * @param appPrivateKey 
 * @param coinType 
 * @param changeAddressIndex 
 * @param redeemType 00=P2PKH 01=P2SH
 */
export const setChangeKeyid = async (
  transport: Transport,
  appId: string,
  appPrivateKey: string,
  coinType: string,
  changeAddressIndex: number,
  redeemType: string
) => {
  const changeKeyId = addressIndexToKeyId(coinType, changeAddressIndex);
  const sig = await getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    commands.SET_CHANGE_KEYID,
    changeKeyId,
    redeemType
  );
  const keyWithSig = changeKeyId + sig.signature;
  return executeCommand(transport, commands.SET_CHANGE_KEYID, target.SE, keyWithSig, redeemType);
};

/**
 * get command signature for CoolWalletS
 * @param {Transport} transport
 * @param {String} txDataHex hex string data for SE
 * @param {String} txDataType hex P1 string
 * @param {String} appPrivateKey
 * @return {String} signature
 */
export const txPrep = async (
  transport: Transport,
  txDataHex: string,
  txDataType: string,
  appPrivateKey: string
): Promise<string> => {
  if (txDataType != '00') {
    const { outputData } = await executeCommand(transport, commands.TX_PREPARE, target.SE, txDataHex, txDataType, '00');
    return outputData;
  } else {
    const sig = await getCommandSignatureWithoutNonce(
      transport,
      appPrivateKey,
      commands.TX_PREPARE,
      txDataHex,
      txDataType,
      '00'
    );
    let encryptedSignature;
    let statusCode = CODE._9999;
    const sendData = txDataHex + sig;
    const patch = Math.ceil(sendData.length / 500);
    for (let i = 0; i < patch; i++) {
      const patchData = sendData.substr(i * 500, 500);
      const p2 = patch === 1 ? "00" : (i === patch - 1 ? "8" : "0") + (i + 1);
      // eslint-disable-next-line no-await-in-loop
      const result = await executeCommand(transport, commands.TX_PREPARE, target.SE, patchData, txDataType, p2);
      
      if ( i == patch-1 ){
        encryptedSignature = result.outputData;
        statusCode = result.statusCode
      }
    }
    
    if (encryptedSignature) {
      return encryptedSignature;
    } else {
      throw new APDUError(commands.TX_PREPARE, statusCode, 'prepareTx get encryptedSignature failed')
    }
  }
};

/**
 * Scriptable step 1
 * @todo append signature
 */
export const sendScript = async (transport: Transport, script: string) => {
  const { statusCode } = await executeCommand(
    transport,
    commands.SEND_SCRIPT,
    target.SE,
    script,
    undefined,
    undefined,
    true
  );
  return statusCode === RESPONSE.SUCCESS;
};

/**
 * Scriptable step 2
 */
export const executeScript = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  argument: string,
) => {
  const { signature } = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.EXECUTE_SCRIPT,
    argument,
    undefined,
    undefined
  );
  const { outputData: encryptedSignature } = await executeCommand(
    transport,
    commands.EXECUTE_SCRIPT,
    target.SE,
    argument + signature,
    undefined,
    undefined,
    true,
    true,
  );
  return encryptedSignature;
};

/**
 * Scriptable step 3
 * @param {*} transport
 * @param {*} argument
 */
export const executeUtxoScript = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  utxoArgument: string,
  //todo
  P1 = "11"
) => {
  const { signature } = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.EXECUTE_UTXO_SCRIPT,
    utxoArgument,
    P1,
    undefined
  );
  const { outputData: encryptedSignature } = await executeCommand(
    transport,
    commands.EXECUTE_UTXO_SCRIPT,
    target.SE,
    utxoArgument + signature,
    P1,
    undefined,
    true,
    true,
  );
  return encryptedSignature;
};

/**
 * Get full transactino composed by SE. Can be use to check if card supports scripts.
 * @todo append signature
 * @param {Transport} transport
 */
export const getSignedHex = async (transport: Transport) => {
  const { outputData: signedTx } = await executeCommand(transport, commands.GET_SIGNED_HEX, target.SE);
  return signedTx;
};

/**
 * Inform CoolWalletS that tx_prepare is completed.
 * @param {Transport} transport
 * @return {Promse<boolean>}
 */
export const finishPrepare = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, commands.FINISH_PREPARE, target.SE);
  return true;
};

/**
 * Get an one-time key to decrypt received signatures.
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getSignatureKey = async (transport: Transport): Promise<string> => {
  const { outputData: signatureKey } = await executeCommand(transport, commands.GET_TX_KEY, target.SE);
  return signatureKey;
};

/**
 * Clear memory on CoolWalletS
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const clearTransaction = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, commands.CLEAR_TX, target.SE);
  return true;
};

/**
 * get Transactino detail shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getTxDetail = async (transport: Transport): Promise<boolean> => {
  const { statusCode } = await executeCommand(transport, commands.GET_TX_DETAIL, target.SE);
  return statusCode === RESPONSE.SUCCESS;
};

/**
 * set built-in ERC20 token payload in CWS.
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const { statusCode } = sn === 1
    ? await executeCommand(transport, commands.SET_ERC20_TOKEN, target.SE, payload)
    : await executeCommand(transport, commands.SET_SECOND_ERC20_TOKEN, target.SE, payload);
  return statusCode === RESPONSE.SUCCESS;
};

/**
 * Set custom ERC20
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setCustomToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const { statusCode } = sn === 1
    ? await executeCommand(transport, commands.SET_ERC20_TOKEN, target.SE, payload, '04', '18')
    : await executeCommand(transport, commands.SET_SECOND_ERC20_TOKEN, target.SE, payload, '04', '18');
  return statusCode === RESPONSE.SUCCESS;
};
