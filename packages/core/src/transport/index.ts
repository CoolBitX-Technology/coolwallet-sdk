import { sendAPDU } from '../device/ble/sendAPDU';

export default class Transport {
  [x: string]: any;
  device: any;
  constructor(
    device: any,
    sendCommandToCard: Function,
    sendDataToCard: Function,
    checkCardStatus: Function,
    readCharacteristic: Function
  ) {
    this.device = device;
    this.sendCommandToCard = this.sendCommandToCard.bind(this);
    this.sendDataToCard = this.sendDataToCard.bind(this);
    this.checkCardStatus = this.checkCardStatus.bind(this);
    this.readDataFromCard = this.readDataFromCard.bind(this);
  }

  static isSupported(): Promise<boolean> {
    throw new Error('not implemented');
  }

  static listen(callback: (error: Error, device: any) => void) {
    throw new Error('not implemented');
  }

  static async connect(deviceOrId: object | string): Promise<Transport> {
    throw new Error('not implemented');
  }

  static async disconnect(deviceOrId: object | string): Promise<void> {
    throw new Error('not implemented');
  }

  static setOnDisconnect(deviceOrId: object | string, onDisconnect: Function): void {
    throw new Error('not implemented');
  }

  async sendCommandToCard(command: number[]): Promise<void>{
    throw new Error('not implemented');
  }

  async sendDataToCard(packets: number[]): Promise<void> {
    throw new Error('not implemented');
  }

  async checkCardStatus(): Promise<number> {
    throw new Error('not implemented');
  }

  async readDataFromCard(): Promise<number[]> {
    throw new Error('not implemented');
  }

  request = async (command: string, packets: string): Promise<string> => {
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
