import * as apdu from '../apdu/index';
import * as core from '../setting/index';
import * as crypto from '../crypto/index';
import * as config from '../config/index';
import Transport from '../transport/index';
import { commands } from "../apdu/execute/command";
import { CODE } from '../config/status/code';
import { target } from '../config/target';

const bip39 = require('bip39');
const { SEPublicKey } = config.KEY;


/**
 * Create a new seed with SE.
 * @param {Transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {Number} strength 12, 18, 24
 * @return {Promise<boolean>}
 */
async function createWallet(transport: Transport, appId: string, appPrivateKey: string, strength: number): Promise<boolean> {
  let strengthHex = strength.toString(16);
  if (strengthHex.length % 2 > 0) strengthHex = `0${strengthHex}`;
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
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

  const { statusCode } = await apdu.execute.executeCommand(
    transport,
    commands.CREATE_WALLET,
    target.SE,
    strengthWithSig,
    undefined,
    undefined,
    true,
    forceUseSC
  );

  return statusCode === CODE._9000;
}

/**
 * Send sum of number seeds.
 * @param {Transport}
 * @param {number} checkSum
 * @return {Promise<boolean>}
 */
async function sendCheckSum(transport: Transport, checkSum: number): Promise<boolean> {
  const sumHex = checkSum.toString(16).padStart(8, '0');
  const { statusCode } = await apdu.execute.executeCommand(transport, commands.CHECKSUM, target.SE, sumHex);
  return statusCode === CODE._9000;
}

/**
 * @param {Transport}
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} seedHex
 * @return {Promise<boolean>}
 */
async function setSeed(transport: Transport, appId: string, appPrivateKey: string, seedHex: string): Promise<boolean> {
  const encryptedSeed = crypto.encryption.ECIESenc(SEPublicKey, seedHex);
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    commands.SET_SEED,
    encryptedSeed,
    undefined
  );
  const signedSeed = encryptedSeed + signature;
  const { statusCode } = await apdu.execute.executeCommand(transport, commands.SET_SEED, target.SE, signedSeed, undefined, undefined, true, forceUseSC);
  return statusCode === CODE._9000;
}

/**
 * 
 * @param {Transport} transport
 * @param {number} strength 
 * @param {number} randomBytes
 * @return {Promise<string>}
 */
async function createSeedByApp(transport: Transport, strength: number, randomBytes: Buffer): Promise<string> {

  const toBit = strength * 10.7;
  const toFloor = Math.floor(toBit);

  let mnemonic;
  const word = bip39.wordlists.english;
  mnemonic = bip39.generateMnemonic(toFloor, randomBytes, word, false);
  console.log(typeof mnemonic)
  return mnemonic
}

/**
 *
 * @param {Transport} transport
 * @param {number} strength 
 */
async function initSecureRecovery(transport: Transport, strength: number) {
  const P1 = strength.toString(16).padStart(2, '0');
  const { statusCode } = await apdu.execute.executeCommand(transport, commands.MCU_SET_MNEMONIC_INFO, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 * 
 * @param {Transport} transport
 * @param {number} index 
 */
async function setSecureRecoveryIdx(transport: Transport, index: number) {
  const P1 = index.toString(16).padStart(2, '0');
  const { statusCode } = await apdu.execute.executeCommand(transport, commands.MCU_SET_CHARACTER_ID, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 *
 * @param {Transport} transport
 * @param {string} type
 */
async function cancelSecureRecovery(transport: Transport, type: string) {
  let P1;
  if (type === '00') {
    P1 = '05';
  } else if (type === '01') {
    P1 = 'A1';
  } else {
    throw Error(`Type:${type} is invalid`);
  }
  const { statusCode } = await apdu.execute.executeCommand(transport, commands.MCU_CANCEL_RECOVERY, target.SE, undefined, P1, undefined);
  return statusCode === CODE._9000;
};

/**
 *
 * @param {Transport} transport
 */
async function getSecureRecoveryStatus(transport: Transport) {
  const { statusCode, outputData } = await apdu.execute.executeCommand(transport, commands.GET_MCU_STATUS, target.SE, undefined, undefined, undefined);
  return statusCode;
}


export let creation = { createWallet, sendCheckSum, setSeed, createSeedByApp };
export let recovery = { setSeed, initSecureRecovery, setSecureRecoveryIdx, cancelSecureRecovery, getSecureRecoveryStatus };
