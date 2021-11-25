/// <reference types="web-bluetooth" />
import { transport as Transport } from '@coolwallet/core';
import { convertToNumberArray } from './utils';

class BleTransport extends Transport.default {
  private commandCharacteristic?: BluetoothRemoteGATTCharacteristic;

  private dataCharacteristic?: BluetoothRemoteGATTCharacteristic;

  private statusCharacteristic?: BluetoothRemoteGATTCharacteristic;

  private responseCharacteristic?: BluetoothRemoteGATTCharacteristic;

  constructor(
    device: BluetoothDevice,
    commandCharacteristic: BluetoothRemoteGATTCharacteristic,
    dataCharacteristic: BluetoothRemoteGATTCharacteristic,
    statusCharacteristic: BluetoothRemoteGATTCharacteristic,
    responseCharacteristic: BluetoothRemoteGATTCharacteristic
  ) {
    super(device);
    this.commandCharacteristic = commandCharacteristic;
    this.dataCharacteristic = dataCharacteristic;
    this.statusCharacteristic = statusCharacteristic;
    this.responseCharacteristic = responseCharacteristic;
  }

  sendCommandToCard = async (command: number[]): Promise<void> => {
    await this.commandCharacteristic?.writeValue(new Uint8Array(command));
  };

  sendDataToCard = async (packets: number[]): Promise<void> => {
    await this.dataCharacteristic?.writeValue(new Uint8Array(packets));
  };

  checkCardStatus = async (): Promise<number> => {
    const status = await this.statusCharacteristic?.readValue();
    return convertToNumberArray(status)[0];
  };

  readDataFromCard = async (): Promise<number[]> => {
    const response = await this.responseCharacteristic?.readValue();
    return convertToNumberArray(response);
  };
}

export default BleTransport;
