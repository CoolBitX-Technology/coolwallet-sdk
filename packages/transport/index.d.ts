export default class Transport {
  constructor(
    device: any,
    sendCommandToCard: Function,
    sendDataToCard: Function,
    checkCardStatus: Function,
    readCharacteristic: Function)

  static isSupported(): Promise<boolean>;

  static listen(callback: (error: Error, device: any) => void): any;

  static connect(deviceOrId: object | string): Promise<Transport>;

  static disconnect(deviceOrId: object | string): Promise<void>;

  static setOnDisconnect(deviceOrId: object | string, onDisconnect: Function): void;

  sendCommandToCard(command: number[]): Promise<void>;

  sendDataToCard(packets: number[]): Promise<void>;

  checkCardStatus(): Promise<number>;

  readDataFromCard(): Promise<number[]>;
}