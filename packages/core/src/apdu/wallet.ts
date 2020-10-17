import { executeCommand } from './execute/execute';
import Transport from '../transport';
import { commands } from "./execute/command";
import { target } from '../config/target';
import { CODE } from '../config/status/code';
import { SDKError, APDUError } from '../error/errorHandle';
import * as setting from '../setting/index';
import * as crypto from '../crypto/index';
import * as config from '../config/index';

const bip39 = require('bip39');
const { SEPublicKey } = config.KEY;

/**
 * TODO 
 * Authorization for requesting account keys
 * @param {Transport} transport
 * @param {string} signature
 * @return { Promise<boolean> }
 */
export const authGetExtendedKey = async (transport: Transport, signature: string, forceUseSC: boolean
): Promise<boolean> => {
  try{
    await executeCommand(transport, commands.AUTH_EXT_KEY, target.SE, signature, undefined, undefined, forceUseSC);
    return true;
  } catch(e) {
    throw new SDKError(authGetExtendedKey.name, 'authGetExtendedKey error')
  }
};


/**
 * Get ECDSA Account Extended public key (Encrypted)
 * @param {*} transport
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @return {Promise<string>}
 */
export const getAccountExtendedKey = async (transport: Transport, coinType: string, accIndex: string): Promise<string> => {
  const { outputData: key, statusCode, msg } = await executeCommand(transport, commands.GET_EXT_KEY, target.SE, undefined, coinType, accIndex);
  if (key) {
    return key
  } else {
    throw new APDUError(commands.GET_EXT_KEY, statusCode, msg)
  }
};


/**
 * Get ED25519 Account Public Key (Encrypted)
 * @param {Transport} transport
 * @param {string} coinType P1
 * @param {string} accIndex P2
 * @param {string} protocol
 * @return {Promise<string>}
 */
export const getEd25519AccountPublicKey = async (transport: Transport, coinType: string, accIndex: string, protocol: string, path: string | undefined): Promise<string> => {
  let commandData;
  let P1;
  let P2;
  let data = undefined;
  if (protocol === 'BIP44') {
    commandData = commands.GET_ED25519_ACC_PUBKEY
    P1 = coinType;
    P2 = accIndex;
  } else if (protocol === 'SLIP0010') {
    commandData = commands.GET_XLM_ACC_PUBKEY
    P1 = coinType
    P2 = "01"
    data = path
  } else {
    throw new SDKError(getEd25519AccountPublicKey.name, 'Unsupported protocol');
  }
  const { outputData: key, statusCode, msg } = await executeCommand(transport, commandData, target.SE, data, P1, P2);
  if (key) {
    return key
  } else {
    throw new APDUError(commandData, statusCode, msg)
  }
};



/**
 * Create a new seed with SE.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {Number} strength 12, 18, 24
 * @return {Promise<boolean>}
 */
export async function createSeedByCard(transport: Transport, appId: string, appPrivateKey: string, strength: number): Promise<boolean> {
  let strengthHex = strength.toString(16);
  if (strengthHex.length % 2 > 0) strengthHex = `0${strengthHex}`;
  const { signature, forceUseSC } = await setting.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    commands.CREATE_WALLET,
    strengthHex,
    undefined,
    undefined,
    true
  );
  const strengthWithSig = strengthHex + signature;

  const { statusCode, msg } = await executeCommand(
    transport,
    commands.CREATE_WALLET,
    target.SE,
    strengthWithSig,
    undefined,
    undefined,
    forceUseSC
  );
  if (statusCode === CODE._9000) {
    return true;
  } else {
    throw new APDUError(commands.CREATE_WALLET, statusCode, msg);
  }
}

/**
 * Send sum of number seeds.
 * @param {Transport}
 * @param {number} checkSum
 * @return {Promise<boolean>}
 */
export async function sendCheckSum(transport: Transport, checkSum: number): Promise<boolean> {
  const sumHex = checkSum.toString(16).padStart(8, '0');
  const { statusCode } = await executeCommand(transport, commands.CHECKSUM, target.SE, sumHex);
  return statusCode === CODE._9000;
}

/**
 * @param {Transport}
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} mnemonic
 * @return {Promise<boolean>}
 */
export async function setSeed(transport: Transport, appId: string, appPrivateKey: string, seedHex: string){
  try{
    const encryptedSeed = crypto.encryption.ECIESenc(SEPublicKey, seedHex);
    const { signature, forceUseSC } = await setting.auth.getCommandSignature(
      transport,
      appId,
      appPrivateKey,
      commands.SET_SEED,
      encryptedSeed,
      undefined
    );
    const signedSeed = encryptedSeed + signature;
    const { statusCode, msg } = await executeCommand(transport, commands.SET_SEED, target.SE, signedSeed, undefined, undefined, forceUseSC);
    if (statusCode === CODE._9000) {
    } else if (statusCode === CODE._6881) {
      throw new APDUError(commands.AUTH_EXT_KEY, statusCode, "wallet is exist")
    } else {
      throw new APDUError(commands.AUTH_EXT_KEY, statusCode, msg)
    }
  } catch (e) {
    console.error(e);
    throw e
  }
}



/**
 *
 * @param {Transport} transport
 * @param {number} strength 
 */
export async function initSecureRecovery(transport: Transport, strength: number) {
  const P1 = strength.toString(16).padStart(2, '0');
  const { statusCode } = await executeCommand(transport, commands.MCU_SET_MNEMONIC_INFO, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 * 
 * @param {Transport} transport
 * @param {number} index 
 */
export async function setSecureRecoveryIdx(transport: Transport, index: number) {
  const P1 = index.toString(16).padStart(2, '0');
  const { statusCode } = await executeCommand(transport, commands.MCU_SET_CHARACTER_ID, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 *
 * @param {Transport} transport
 * @param {string} type
 */
export async function cancelSecureRecovery(transport: Transport, type: string) {
  let P1;
  if (type === '00') {
    P1 = '05';
  } else if (type === '01') {
    P1 = 'A1';
  } else {
    throw Error(`Type:${type} is invalid`);
  }
  const { statusCode } = await executeCommand(transport, commands.MCU_CANCEL_RECOVERY, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 *
 * @param {Transport} transport
 */
export async function getSecureRecoveryStatus(transport: Transport) {
  const { statusCode, outputData } = await executeCommand(transport, commands.GET_MCU_STATUS, target.SE, undefined, undefined, undefined);
  return statusCode;
}

/**
 *
 * @param {Transport} transport
 */
export async function initMcuSetSeed(transport: Transport) {
  const { statusCode, outputData } = await executeCommand(transport, commands.MCU_START_SET_SEED, target.SE, undefined, undefined, undefined);
  return statusCode;
}

export let creation = { createSeedByCard, sendCheckSum, setSeed };
export let recovery = { setSeed, initSecureRecovery, setSecureRecoveryIdx, cancelSecureRecovery, getSecureRecoveryStatus, initMcuSetSeed };
