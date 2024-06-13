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
 * @deprecated Please use tx.command.sendScript instead
 * @param transport
 * @param script
 * @returns
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
 * @deprecated Please use tx.command.executeScript instead
 * @param transport
 * @param appId
 * @param appPrivKey
 * @param argument
 * @returns
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
 * Scriptable step 3 : Send smart contract data one by one and hash it in card.
 * @deprecated Please use tx.command.executeSegmentScript instead
 * @param transport
 * @param appId
 * @param appPrivKey
 * @param argument
 * @returns
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
    // P1 is a single byte, if `i` is greater than 255, it will overflow to '100'
    // which is not safe to use it. So if `i` is greater than 255 iterate again from 1.
    if (i > 255) {
      counter -= 255;
    }
    const p1 = counter.toString(16).padStart(2, '0');
    const signature = await getCommandSignature(
      transport,
      appId,
      appPrivKey,
      commands.EXECUTE_SEGMENT_SCRIPT,
      v,
      p1,
      undefined
    );
    const { outputData, statusCode, msg } = await executeCommand(
      transport,
      commands.EXECUTE_SEGMENT_SCRIPT,
      target.SE,
      v + signature,
      p1,
      undefined
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
 * @deprecated Please use tx.command.executeUtxoScript instead
 * @param transport
 * @param appId
 * @param appPrivKey
 * @param utxoArgument
 * @param extraTransactionType
 * @returns
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
 * Scriptable step 3
 * @deprecated Please use tx.command.executeUtxoSegmentScript instead
 * @param transport
 * @param appId
 * @param appPrivKey
 * @param utxoArgument
 * @returns
 */
export const executeUtxoSegmentScript = async (
  transport: Transport,
  appId: string,
  appPrivKey: string,
  utxoArgument: string
) => {
  if (utxoArgument.length > 2147483648 * 2) throw new Error('argument too long');

  const args = utxoArgument.match(/.{2,3800}/g);
  if (args === null) throw new Error('argument is empty');

  if (args.length > 1) {
    const version = await getSEVersion(transport);
    if (version < 320) throw new Error('argument too long, try updating to support the longer data');
  }

  const total = args.length - 1;
  for (const [i, v] of args.entries()) {
    let counter = i;
    // P1 is a single byte, if `i` is greater than 255, it will overflow to '100'
    // which is not safe to use it. So if `i` is greater than 255 iterate again from 1.
    if (i > 255) {
      counter -= 255;
    }
    const p1 = counter.toString(16).padStart(2, '0');
    const signature = await getCommandSignature(
      transport,
      appId,
      appPrivKey,
      commands.EXECUTE_UTXO_SEGMENT_SCRIPT,
      v,
      p1,
      undefined
    );
    const { outputData, statusCode, msg } = await executeCommand(
      transport,
      commands.EXECUTE_UTXO_SEGMENT_SCRIPT,
      target.SE,
      v + signature,
      p1,
      undefined
    );
    if (i === total) {
      if (outputData) {
        return outputData;
      } else {
        throw new APDUError(commands.EXECUTE_UTXO_SEGMENT_SCRIPT, statusCode, msg);
      }
    }
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

/**
 * Scriptable step 4 : Execute a script which have rlp items
 * @deprecated Please use tx.command.executeRlpScript instead
 * @param transport
 * @param appId
 * @param appPrivKey
 * @param path
 * @param rlpItems
 * @param argument
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
 * Get full transactino composed by SE. Can be use to check if card supports scripts.
 * @deprecated Please use tx.command.getSignedHex instead
 * @param transport
 * @returns
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
 * Inform CoolWallet that tx_prepare is completed.
 * @deprecated Please use tx.command.finishPrepare instead
 * @param transport
 * @returns
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
 * @deprecated Please use tx.command.getSignatureKey instead
 * @param transport
 * @returns
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
 * Clear memory on CoolWallet
 * @deprecated Please use tx.command.clearTransaction instead
 * @param transport
 * @returns
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
 * @deprecated Please use tx.command.getTxDetail instead
 * @param transport
 * @returns
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
 * @deprecated Please use tx.command.getExplicitTxDetail instead
 * @param transport
 * @returns
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
 * @deprecated Please use tx.command.setToken instead
 * @param transport
 * @param payload
 * @param sn  1: normal erc20, 2: second token in 0x.
 * @returns
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
 * @deprecated Please use tx.command.setCustomToken instead
 * @param transport
 * @param payload
 * @param sn
 * @returns
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
