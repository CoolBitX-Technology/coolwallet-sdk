import {
  apdu, core, crypto, config
} from '@coolwallets/core';

const bip39 = require('bip39')
const { SEPublicKey } = config.KEY;

/**
 * Create a new seed with SE.
 * @param {transport} transport
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {Number} strength 12, 18, 24
 * @return {Promise<boolean>}
 */
export async function createWallet(transport, appId, appPrivateKey, strength) {
  let strengthHex = strength.toString(16);
  if (strengthHex.length % 2 > 0) strengthHex = `0${strengthHex}`;
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    'CREATE_WALLET',
    strengthHex
  );
  const strengthWithSig = strengthHex + signature;
  return apdu.wallet.createWallet(transport, strengthWithSig, forceUseSC);
}

/**
 * Send sum of number seeds.
 * @param {transport}
 * @param {number} checkSum
 * @return {Promise<boolean>}
 */
export async function sendCheckSum(transport, checkSum) {
  const sumHex = checkSum.toString(16).padStart(8, '0');
  return apdu.wallet.submitCheckSum(transport, sumHex);
}

/**
 * @param {Transport}
 * @param {string} appId
 * @param {string} appPrivateKey
 * @param {string} seedHex
 * @return {Promise<boolean>}
 */
export async function setSeed(transport, appId, appPrivateKey, seedHex) {
  const encryptedSeed = crypto.encryption.ECIESenc(SEPublicKey, seedHex);
  const { signature, forceUseSC } = await core.auth.getCommandSignature(
    transport,
    appId,
    appPrivateKey,
    'SET_SEED',
    encryptedSeed
  );
  const signedSeed = encryptedSeed + signature;
  return apdu.wallet.setSeed(transport, signedSeed, forceUseSC);
}

/**
 * 
 * @param {Transport}
 * @param {number} strength 
 * @param {number} randomBytes
 * @return {Promise<string>}
 */
export async function createSeedByApp(transport, strength, randomBytes) {

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
 * @param {Transport}
 * @param {number} strength 
 */
export async function initSecureRecovery (transport, strength) {
  const P1 = strength.toString(16).padStart(2, '0');
  apdu.wallet.initSecureRecovery(transport, P1);
};

/**
 * 
 * @param {Transport} transport
 * @param {number} index 
 */
export async function setSecureRecveryIdx(transport, index) {
  const P1 = index.toString(16).padStart(2, '0'); 
  apdu.wallet.setSecureRecveryIdx(transport, P1);
};

/**
 *
 * @param {Transport} transport
 * @param {number} type
 */
export async function cancelSecureRecovery(transport, type) {
  let P1;
  if (type === '00') {
    P1 = '05';
  } else if (type === '01') {
    P1 = 'A1';
  } else {
    throw Error(`Type:${type} is invalid`);
  }
  apdu.wallet.cancelSecureRecovery(transport, P1);
};
