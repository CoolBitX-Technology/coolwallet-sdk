import { Device, sendAPDU } from "@coolwallets/devices";
import { Characteristic } from "./types";

export * from "./types";

export default class Transport {
  constructor(
    device: Device,
    writeCharacteristic: Characteristic,
    dataCharacteristic: Characteristic,
    checkCharacteristic: Characteristic,
    readCharacteristic: Characteristic) {
  }

  static isSupported = (): Promise<boolean> => {
    throw new Error('not implemented');
  };

  static listen(callback: (error, device: { name: string, mac: string }) => void) {
    throw new Error('not implemented');
  }

  static async connect(deviceId: string): Promise<Transport> {
    throw new Error('not implemented');
  }

  static disconnect = async (id: string) => {
    throw new Error('not implemented');
  };

  sendCommandToCard = async (command: number[]) => {
    throw new Error('not implemented');
  };

  sendDataToCard = async (packets: number[]) => {
    throw new Error('not implemented');
  };

  checkCardStatus = async () => {
    throw new Error('not implemented');
  };

  readDataFromCard = async () => {
    throw new Error('not implemented');
  };

  request = async (command: string, packets: string): Promise<string | never> => {
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