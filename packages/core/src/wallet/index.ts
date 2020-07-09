import { generateKeyPair } from './keypair';
import Transport from '../transport/index';
import * as pairing from './pairing';
import { recovery, creation } from './create';
import * as setting from './settings';
import * as general from '../apdu/general';

// type Transport = transport.default;

export { generateKeyPair };
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

  async getCardInfo() {
    return setting.getCardInfo(this.transport);
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
  async createWallet(strength: number) {
    return creation.createWallet(this.transport, this.appId, this.appPrivateKey, strength);
  }

  async createSeedByApp(strength: number, randomBytes: Buffer) {
    return creation.createSeedByApp(this.transport, strength, randomBytes);
  }

  async sendCheckSum(sum: number) {
    return creation.sendCheckSum(this.transport, sum);
  }

  async setSeed(seedHex: string) {
    return creation.setSeed(this.transport, this.appId, this.appPrivateKey, seedHex);
  }

  async initSecureRecovery(strength: number) {
    return recovery.initSecureRecovery(this.transport, strength);
  }

  async setSecureRecoveryIdx(index: number) {
    return recovery.setSecureRecoveryIdx(this.transport, index);
  }

  async cancelSecureRecovery(type: string) {
    return recovery.cancelSecureRecovery(this.transport, type);
  }

  async getSecureRecoveryStatus() {
    return recovery.getSecureRecoveryStatus(this.transport);
  }
}




