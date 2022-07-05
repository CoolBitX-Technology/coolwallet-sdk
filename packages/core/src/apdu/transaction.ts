import * as RLP from 'rlp';
import { executeCommand } from './execute/execute';
import { getCommandSignature } from '../setting/auth';
import Transport from '../transport';
import { commands } from './execute/command';
import { APDUError, SDKError } from '../error/errorHandle';
import { CODE } from '../config/status/code';
import { target } from '../config/param';
import { getSEVersion } from './general';

/**
 * Scriptable step 1
 * @todo append signature
 */
export const sendScript = async (transport: Transport, script: string) => {
  const { statusCode, msg } = await executeCommand(transport, commands.SEND_SCRIPT, target.SE, script);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.SEND_SCRIPT, statusCode, msg);
  }
};

/**
 * Scriptable step 2 : sign tx by arguments and return encrypted signature
 */
export const executeScript = async (transport: Transport, appId: string, appPrivKey: string, argument: string) => {
  if (argument.length > 20000) throw new Error('argument too long');

  const args = argument.match(/.{2,3800}/g);
  if (args === null) throw new Error('argument is empty');

  if (args.length > 1) {
    const version = await getSEVersion(transport);
    if (version < 314) throw new Error('argument too long, try updating to support the longer data');
  }

  for (const [i, v] of args.entries()) {
    const p1 = i.toString(16).padStart(2, '0');
    const p2 = args.length.toString(16).padStart(2, '0');
    const signature = await getCommandSignature(transport, appId, appPrivKey, commands.EXECUTE_SCRIPT, v, p1, p2);
    const { outputData, statusCode, msg } = await executeCommand(
      transport,
      commands.EXECUTE_SCRIPT,
      target.SE,
      v + signature,
      p1,
      p2
    );
    if (i + 1 === args.length) {
      if (outputData) {
        return outputData;
      } else {
        throw new APDUError(commands.EXECUTE_SCRIPT, statusCode, msg);
      }
    }
  }
};

/**
 * Scriptable step 3.
 *
 * Send smart contract data one by one and hash it in card.
 *
 * @param transport Transport layer
 * @param appId application id
 * @param appPrivKey application private key
 * @param argument smart contract data
 * @returns encryptedSignature
 */
export const executeSegmentScript = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  argument: string
) => {
  if (argument.length > 2147483648 * 2) throw new Error('argument too long');

  const args = argument.match(/.{2,3800}/g);
  if (args === null) throw new Error('argument is empty');

  if (args.length > 1) {
    const version = await getSEVersion(transport);
    if (version < 320) throw new Error('argument too long, try updating to support the longer data');
  }

  const total = args.length - 1;
  for (const [i, v] of args.entries()) {
    let counter = i;
    // P1 and P2 is a single byte, if `i` is greater than 255, it will overflow to '100'
    // which is not safe to use it. So if `i` is greater than 255 iterate again from 1.
    if (i > 255) {
      counter -= 255;
    }
    const p1 = counter.toString(16).padStart(2, '0');
    const p2 = (counter + 1).toString(16).padStart(2, '0');
    const signature = await getCommandSignature(
      transport,
      appId,
      appPrivKey,
      commands.EXECUTE_SEGMENT_SCRIPT,
      v,
      p1,
      p2
    );
    const { outputData, statusCode, msg } = await executeCommand(
      transport,
      commands.EXECUTE_SEGMENT_SCRIPT,
      target.SE,
      v + signature,
      p1,
      p2
    );
    if (i === total) {
      if (outputData) {
        return outputData;
      } else {
        throw new APDUError(commands.EXECUTE_SEGMENT_SCRIPT, statusCode, msg);
      }
    }
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
  extraTransactionType: string
) => {
  const signature = await getCommandSignature(
    transport,
    appId,
    appPrivKey,
    commands.EXECUTE_UTXO_SCRIPT,
    utxoArgument,
    extraTransactionType,
    undefined
  );
  const {
    outputData: encryptedSignature,
    statusCode,
    msg,
  } = await executeCommand(
    transport,
    commands.EXECUTE_UTXO_SCRIPT,
    target.SE,
    utxoArgument + signature,
    extraTransactionType,
    undefined
  );
  if (encryptedSignature) {
    return encryptedSignature;
  } else {
    throw new APDUError(commands.EXECUTE_UTXO_SCRIPT, statusCode, msg);
  }
};

/**
 * Scriptable step 4:
 *
 * Execute a script which have rlp items
 *
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivKey
 * @param {string} path CoolWallet specific path string
 * @param {(Buffer | string)[]} rlpItems rlp array with buffer and string
 * @param {string?} argument
 * @returns
 */
export const executeRlpScript = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  path: string,
  rlpItems: (Buffer | string)[],
  argument?: string
) => {
  if (rlpItems.length > 64) throw new SDKError(executeRlpScript.name, 'rlp items should be less than 64');
  const encodedRlp = RLP.encode(rlpItems).toString('hex');

  return executeScript(transport, appId, appPrivKey, path + encodedRlp + (argument ?? ''));
};

/**
 * 9000 true  6D00 false  other error
 * Get full transactino composed by SE. Can be use to check if card supports scripts.
 * @todo append signature
 * @param {Transport} transport
 * @return {Promse<{ signedTx: string, statusCode: string }>}
 */
export const getSignedHex = async (transport: Transport): Promise<{ signedTx: string; statusCode: string }> => {
  const { outputData: signedTx, statusCode, msg } = await executeCommand(transport, commands.GET_SIGNED_HEX, target.SE);
  if (statusCode === CODE._9000 || statusCode === CODE._6D00) {
    return { signedTx, statusCode };
  } else {
    throw new APDUError(commands.GET_SIGNED_HEX, statusCode, msg);
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
    throw new APDUError(commands.FINISH_PREPARE, statusCode, msg);
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
    throw new APDUError(commands.GET_TX_KEY, statusCode, msg);
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
    throw new APDUError(commands.CLEAR_TX, statusCode, msg);
  }
};

/**
 * get transaction detail shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getTxDetail = async (transport: Transport): Promise<boolean> => {
  const { statusCode, msg } = await executeCommand(transport, commands.GET_TX_DETAIL, target.SE);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.GET_TX_DETAIL, statusCode, msg);
  }
};

/**
 * get transaction detail message and shown on hardware.
 * @param {Transport} transport
 * @return {Promise<boolean>} true: success, false: canceled.
 */
export const getExplicitTxDetail = async (transport: Transport): Promise<string> => {
  const { statusCode, msg, outputData } = await executeCommand(transport, commands.GET_TX_DETAIL, target.SE);
  if (statusCode === CODE._9000) {
    return outputData;
  } else {
    throw new APDUError(commands.GET_TX_DETAIL, statusCode, msg);
  }
};

/**
 * set built-in ERC20 token payload in CWS.
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setToken = async (transport: Transport, payload: string, sn = 1): Promise<boolean> => {
  const command = sn === 1 ? commands.SET_ERC20_TOKEN : commands.SET_SECOND_ERC20_TOKEN;
  const { statusCode, msg } = await executeCommand(transport, command, target.SE, payload);
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(command, statusCode, msg);
  }
};

/**
 * Set custom ERC20
 * @param {Transport} transport
 * @param {string} payload
 * @param {number} sn 1: normal erc20, 2: second token in 0x.
 * @return {Promise<boolean>}
 */
export const setCustomToken = async (transport: Transport, payload: string, sn = 1): Promise<boolean> => {
  const command = sn === 1 ? commands.SET_ERC20_TOKEN : commands.SET_SECOND_ERC20_TOKEN;
  const { statusCode, msg } = await executeCommand(transport, command, target.SE, payload, '04', '18');
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(command, statusCode, msg);
  }
};
