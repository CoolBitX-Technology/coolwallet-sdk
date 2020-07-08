import { executeCommand } from './execute/execute';
import { getCommandSignature, getCommandSignatureWithoutNonce } from "../setting/auth";
import Transport from '../transport';
import { addressIndexToKeyId } from '../transaction/txUtil'
import { commands, CommandType } from "./execute/command";
import { SDKError, APDUError } from '../error/errorHandle';
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
  const { statusCode, msg } = await executeCommand(transport, commands.SET_CHANGE_KEYID, target.SE, keyWithSig, redeemType);
  if (statusCode !== CODE._9000) {
    throw new APDUError(commands.SET_CHANGE_KEYID, statusCode, msg)
  }
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

  let encryptedSignature;
  let statusCode = CODE._9999;
  let msg = 'prepareTx get encryptedSignature failed';
  if (txDataType != '00') {
    const result = await executeCommand(transport, commands.TX_PREPARE, target.SE, txDataHex, txDataType, '00');
    encryptedSignature = result.outputData;
    statusCode = result.statusCode
    msg = result.msg
  } else {
    const sig = await getCommandSignatureWithoutNonce(
      transport,
      appPrivateKey,
      commands.TX_PREPARE,
      txDataHex,
      txDataType,
      '00'
    );
    const sendData = txDataHex + sig;
    const patch = Math.ceil(sendData.length / 500);
    for (let i = 0; i < patch; i++) {
      const patchData = sendData.substr(i * 500, 500);
      const p2 = patch === 1 ? "00" : (i === patch - 1 ? "8" : "0") + (i + 1);
      // eslint-disable-next-line no-await-in-loop
      const result = await executeCommand(transport, commands.TX_PREPARE, target.SE, patchData, txDataType, p2);

      if (i == patch - 1) {
        encryptedSignature = result.outputData;
        statusCode = result.statusCode
        msg = result.msg
      }
    }
  }
  if (encryptedSignature) {
    return encryptedSignature;
  } else {
    throw new APDUError(commands.TX_PREPARE, statusCode, msg)
  }
};

/**
 * Scriptable step 1
 * @todo append signature
 */
export const sendScript = async (transport: Transport, script: string) => {
  const { statusCode, msg } = await executeCommand(
    transport,
    commands.SEND_SCRIPT,
    target.SE,
    script,
    undefined,
    undefined,
    true
  );
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.SEND_SCRIPT, statusCode, msg)
  }
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
  const { outputData: encryptedSignature, statusCode, msg } = await executeCommand(
    transport,
    commands.EXECUTE_SCRIPT,
    target.SE,
    argument + signature,
    undefined,
    undefined,
    true,
    true,
  );
  if (encryptedSignature) {
    return encryptedSignature;
  } else {
    throw new APDUError(commands.EXECUTE_SCRIPT, statusCode, msg)
  }
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
  const { outputData: encryptedSignature, statusCode, msg } = await executeCommand(
    transport,
    commands.EXECUTE_UTXO_SCRIPT,
    target.SE,
    utxoArgument + signature,
    P1,
    undefined,
    true,
    true,
  );
  if (encryptedSignature) {
    return encryptedSignature;
  } else {
    throw new APDUError(commands.EXECUTE_UTXO_SCRIPT, statusCode, msg)
  }
};

/**
 * 9000 true  6D00 false  other error
 * Get full transactino composed by SE. Can be use to check if card supports scripts.
 * @todo append signature
 * @param {Transport} transport
 * @return {Promse<{ signedTx: string, statusCode: string }>}
 */
export const getSignedHex = async (transport: Transport): Promise<{ signedTx: string, statusCode: string }> => {
  const { outputData: signedTx, statusCode, msg } = await executeCommand(transport, commands.GET_SIGNED_HEX, target.SE);
  if (signedTx){
    return { signedTx, statusCode };
  } else {
    throw new APDUError(commands.GET_SIGNED_HEX, statusCode, msg)
  }
};

/**
 * Inform CoolWalletS that tx_prepare is completed.
 * @param {Transport} transport
 * @return {Promse<boolean>}
 */
export const finishPrepare = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.FINISH_PREPARE, target.SE);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.FINISH_PREPARE, statusCode, msg)
  }
};

/**
 * Get an one-time key to decrypt received signatures.
 * @param {Transport} transport
 * @return {Promise<string>}
 */
export const getSignatureKey = async (transport: Transport): Promise<string> => {
  const { outputData: signatureKey, statusCode, msg } = await executeCommand(transport, commands.GET_TX_KEY, target.SE);
  if (signatureKey) {
    return signatureKey;
  } else {
    throw new APDUError(commands.GET_TX_KEY, statusCode, msg)
  }
};

/**
 * Clear memory on CoolWalletS
 * @param {Transport} transport
 * @return {Promise<boolean>}
 */
export const clearTransaction = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.CLEAR_TX, target.SE);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.CLEAR_TX, statusCode, msg)
  }
};

/**
 * get Transactino detail shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getTxDetail = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.GET_TX_DETAIL, target.SE);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.GET_TX_DETAIL, statusCode, msg)
  }
};

/**
 * set built-in ERC20 token payload in CWS.
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const command = sn === 1 ? commands.SET_ERC20_TOKEN : commands.SET_SECOND_ERC20_TOKEN;
  const { statusCode, msg } = await executeCommand(transport, command, target.SE, payload)
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(command, statusCode, msg)
  }
};

/**
 * Set custom ERC20
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setCustomToken = async (transport: Transport, payload: string, sn: number = 1): Promise<boolean> => {
  const command = sn === 1 ? commands.SET_ERC20_TOKEN : commands.SET_SECOND_ERC20_TOKEN;
  const { statusCode, msg } = await executeCommand(transport, command, target.SE, payload, '04', '18')
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(command, statusCode, msg)
  }
};
