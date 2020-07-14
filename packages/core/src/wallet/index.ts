import Transport from '../transport/index';
import * as pairing from '../apdu/pair';
import * as wallet from '../apdu/wallet';
import * as general from '../apdu/general';
import * as config from '../config/index';
import * as apdu from '../apdu/index';
import { SDKError, APDUError } from '../error/errorHandle';
const bip39 = require('bip39');
const { SEPublicKey } = config.KEY;

import crypto from 'crypto';

const elliptic = require('elliptic');

const ec = new elliptic.ec('secp256k1');

export const generateKeyPair = () => {
  const random = crypto.randomBytes(32);
  const keyPair = ec.keyFromPrivate(random);
  const publicKey = keyPair.getPublic(false, 'hex');
  const privateKey = keyPair.getPrivate('hex');
  return { privateKey, publicKey };
};

export default class CoolWallet {
  transport: Transport;
  appPrivateKey: string;
  appId: string;

  constructor(transport: Transport, appPrivateKey: string, appId: string) {
    this.transport = transport;
    this.appPrivateKey = appPrivateKey;
    this.appId = appId;

    this.setAppId = this.setAppId.bind(this);
    this.getSEVersion = this.getSEVersion.bind(this);
    this.register = this.register.bind(this);
    this.resetCard = this.resetCard.bind(this);
    this.getPairingPassword = this.getPairingPassword.bind(this);
  }

  setAppId(appId: string) {
    this.appId = appId;
  }
  /**
   * Get Baisc information of CoolWallet
   * @return {Promise<{ paired:boolean, locked:boolean, walletCreated:boolean, showDetail:boolean, pairRemainTimes:number }>}
   */
  async getCardInfo(): Promise<{ paired: boolean; locked: boolean; walletCreated: boolean; showDetail: boolean; pairRemainTimes: number; }> {
    const outputData = await apdu.info.getCardInfo(this.transport);
    const databuf = Buffer.from(outputData, 'hex');
    const pairStatus = databuf.slice(0, 1).toString('hex');
    const lockedStatus = databuf.slice(1, 2).toString('hex');
    const pairRemainTimes = parseInt(databuf.slice(2, 3).toString('hex'), 16);
    const walletStatus = databuf.slice(3, 4).toString('hex');
    const accountDigest = databuf.slice(4, 9).toString('hex');
    const displayType = databuf.slice(9).toString('hex');

    if (accountDigest === '81c69f2d90' || accountDigest === '3d84ba58bf' || accountDigest === '83ccf4aab1') {
      throw new SDKError(this.getCardInfo.name, 'Bad Firmware statusCode. Please reset your CoolWalletS.');
    }

    const paired = pairStatus === '01';
    const locked = lockedStatus === '01';
    const walletCreated = walletStatus === '01';
    const showDetail = displayType === '00';

    return {
      paired,
      locked,
      walletCreated,
      showDetail,
      pairRemainTimes,
    };
  }

  async checkRegistered() {
    return general.hi(this.transport, this.appId);
  }

  async getSEVersion() {
    return general.getSEVersion(this.transport);
  }

  async resetCard() {
    return general.resetCard(this.transport);
  }

  async register(appPublicKey: string, password: string, deviceName: string) {
    return pairing.register(this.transport, appPublicKey, password, deviceName);
  }

  async getPairingPassword() {
    return pairing.getPairingPassword(this.transport, this.appId, this.appPrivateKey);
  }

  async getPairedApps() {
    return pairing.getPairedApps(this.transport, this.appId, this.appPrivateKey);
  }

  // For wallet creation
  async createSeedByCard(strength: number) {
    return wallet.createSeedByCard(this.transport, this.appId, this.appPrivateKey, strength);
  }

  async createSeedByApp(strength: number, randomBytes: Buffer): Promise<string> {

    const toBit = strength * 10.7;
    const toFloor = Math.floor(toBit);

    let mnemonic;
    const word = bip39.wordlists.english;
    mnemonic = bip39.generateMnemonic(toFloor, randomBytes, word, false);
    console.log(typeof mnemonic)
    return mnemonic
    
  }

  async sendCheckSum(sum: number) {
    return wallet.sendCheckSum(this.transport, sum);
  }

  async setSeed(mnemonic: string) {
    return wallet.setSeed(this.transport, this.appId, this.appPrivateKey, mnemonic);
  }

  async initSecureRecovery(strength: number) {
    return wallet.initSecureRecovery(this.transport, strength);
  }

  async setSecureRecoveryIdx(index: number) {
    return wallet.setSecureRecoveryIdx(this.transport, index);
  }

  async cancelSecureRecovery(type: string) {
    return wallet.cancelSecureRecovery(this.transport, type);
  }

  async getSecureRecoveryStatus() {
    return wallet.getSecureRecoveryStatus(this.transport);
  }
}




