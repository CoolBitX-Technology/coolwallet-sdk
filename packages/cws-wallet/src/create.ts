import {
  apdu, core, crypto, config
} from '@coolwallet/core';
import { transport } from '@coolwallet/core';

const bip39 = require('bip39');
const { SEPublicKey } = config.KEY;

type Transport = transport.default;

const SUCCESS = config.RESPONSE.DFU_RESPONSE.SUCCESS;

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
    'CREATE_WALLET',
    strengthHex,
    undefined,
    undefined,
    true
  );
  const strengthWithSig = strengthHex + signature;

  const { status } = await apdu.execute.executeCommand(
    transport,
    'CREATE_WALLET',
    'SE',
    strengthWithSig,
    undefined,
    undefined,
    true,
    forceUseSC
  );

  return status === SUCCESS;
}

/**
 * Send sum of number seeds.
 * @param {Transport}
 * @param {number} checkSum
 * @return {Promise<boolean>}
 */
async function sendCheckSum(transport: Transport, checkSum: number): Promise<boolean> {
  const sumHex = checkSum.toString(16).padStart(8, '0');
  const { status } = await apdu.execute.executeCommand(transport, 'CHECKSUM', 'SE', sumHex);
  return status === SUCCESS;
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
    'SET_SEED',
    encryptedSeed,
    undefined
  );
  const signedSeed = encryptedSeed + signature;
  const { status } = await apdu.execute.executeCommand(transport, 'SET_SEED', 'SE', signedSeed, undefined, undefined, true, forceUseSC);
  return status === SUCCESS;
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
  const { status } = await apdu.execute.executeCommand(transport, 'MCU_SET_MNEMONIC_INFO', 'SE', undefined, P1, undefined);
  return status === SUCCESS;
};

/**
 * 
 * @param {Transport} transport
 * @param {number} index 
 */
async function setSecureRecoveryIdx(transport: Transport, index: number) {
  const P1 = index.toString(16).padStart(2, '0'); 
  const { status } = await apdu.execute.executeCommand(transport, 'MCU_SET_CHARACTER_ID', 'SE', undefined, P1, undefined);
  return status === SUCCESS;
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
  const { status } = await apdu.execute.executeCommand(transport, 'MCU_CANCEL_RECOVERY', 'SE', undefined, P1, undefined);
  return status === SUCCESS;
};

/**
 *
 * @param {Transport} transport
 */
async function getSecureRecoveryStatus(transport: Transport){
  const { status, outputData } = await apdu.execute.executeCommand(transport, 'GET_MCU_STATUS', 'SE', undefined, undefined, undefined);
  return status;
}


export let creation = { createWallet, sendCheckSum, setSeed, createSeedByApp };
export let recovery = { setSeed, initSecureRecovery, setSecureRecoveryIdx, cancelSecureRecovery, getSecureRecoveryStatus };
