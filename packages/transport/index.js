import { sendAPDU } from "@coolwallets/devices/ble/sendAPDU";

export default class Transport {
  constructor(
    device,
    sendCommandToCard,
    sendDataToCard,
    checkCardStatus,
    readCharacteristic) {
    this.device = device;
    this.sendCommandToCard = this.sendCommandToCard.bind(this);
    this.sendDataToCard = this.sendDataToCard.bind(this);
    this.checkCardStatus = this.checkCardStatus.bind(this);
    this.readDataFromCard = this.readDataFromCard.bind(this);
  }

  static isSupported() {
    throw new Error('not implemented');
  };

  static listen(callback) {
    throw new Error('not implemented');
  }

  static async connect(deviceId) {
    throw new Error('not implemented');
  }

  static async disconnect(id) {
    throw new Error('not implemented');
  };

  async sendCommandToCard(command) {
    throw new Error('not implemented');
  };

  async sendDataToCard(packets) {
    throw new Error('not implemented');
  };

  async checkCardStatus() {
    throw new Error('not implemented');
  };

  async readDataFromCard() {
    throw new Error('not implemented');
  };

  request = async (command, packets) => {
    const data = await sendAPDU(
      this.sendCommandToCard,
      this.sendDataToCard,
      this.checkCardStatus,
      this.readDataFromCard,
      command,
      packets
    );
    return data;
  }
}