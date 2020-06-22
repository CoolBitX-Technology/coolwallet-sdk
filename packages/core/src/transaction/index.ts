import { executeCommand } from '../apdu/execute';
import { RESPONSE } from '../config/response';
import { getCommandSignature } from "../core/auth";
import Transport from '../transport';

/**
 * Send sign data to CoolWalletS
 * @param {Transport} transport
 * @param {string} payload
 * @param {string} P1
 * @param {string} P2
 * @return {Promise<string>}
 */
export const prepTx = async (transport: Transport, payload: string, P1: string, P2: string): Promise<string> => {
  const { outputData } = await executeCommand(transport, 'TX_PREPARE', 'SE', payload, P1, P2);
  return outputData;
};

/**
 * Scriptable step 1
 * @todo append signature
 */
export const sendScript = async (transport: Transport, script: string) => {
  const { status } = await executeCommand(
    transport,
    'SEND_SCRIPT',
    'SE',
    script,
    undefined,
    undefined,
    true
  );
  return status === RESPONSE.SUCCESS;
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
    "EXECUTE_SCRIPT",
    argument,
    undefined,
    undefined
  );
  const { outputData: encryptedSignature } = await executeCommand(
    transport,
    'EXECUTE_SCRIPT',
    'SE',
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
    "EXECUTE_UTXO_SCRIPT",
    utxoArgument,
    P1,
    undefined
  );
  const { outputData: encryptedSignature } = await executeCommand(
    transport,
    'EXECUTE_UTXO_SCRIPT',
    'SE',
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
  const { outputData: signedTx } = await executeCommand(transport, 'GET_SIGNED_HEX', 'SE');
  return signedTx;
};

/**
 * Inform CoolWalletS that tx_prepare is completed.
 * @param {Transport} transport
 * @return {Promse<boolean>}
 */
export const finishPrepare = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, 'FINISH_PREPARE', 'SE');
  return true;
};

/**
 * Get an one-time key to decrypt received signatures.
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getSignatureKey = async (transport: Transport): Promise<string> => {
  const { outputData: signatureKey } = await executeCommand(transport, 'GET_TX_KEY', 'SE');
  return signatureKey;
};

/**
 * Clear memory on CoolWalletS
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const clearTransaction = async (transport: Transport): Promise<boolean> => {
  await executeCommand(transport, 'CLEAR_TX', 'SE');
  return true;
};

/**
 * get Transactino detail shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getTxDetail = async (transport: Transport): Promise<boolean> => {
  const { status } = await executeCommand(transport, 'GET_TX_DETAIL', 'SE');
  return status === RESPONSE.SUCCESS;
};

/**
 * set built-in ERC20 token payload in CWS.
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const { status } = sn === 1
    ? await executeCommand(transport, 'SET_ERC20_TOKEN', 'SE', payload)
    : await executeCommand(transport, 'SET_SECOND_ERC20_TOKEN', 'SE', payload);
  return status === RESPONSE.SUCCESS;
};

/**
 * Set custom ERC20
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setCustomToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const { status } = sn === 1
    ? await executeCommand(transport, 'SET_ERC20_TOKEN', 'SE', payload, '04', '18')
    : await executeCommand(transport, 'SET_SECOND_ERC20_TOKEN', 'SE', payload, '04', '18');
  return status === RESPONSE.SUCCESS;
};

/**
 * Set change path
 * @param {Transport} transport
 * @param {string} pathWithSig data field
 * @param {string} redeemType P1
 * @return {Promise<boolean>}
 */
export const setChangeKeyId = async (transport: Transport, pathWithSig: string, redeemType: string): Promise<boolean> => {
  await executeCommand(transport, 'SET_CHANGE_KEYID', 'SE', pathWithSig, redeemType);
  return true;
};
