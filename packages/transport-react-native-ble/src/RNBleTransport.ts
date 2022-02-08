import type { Characteristic, Device as BluetoothDevice, BleError } from 'react-native-ble-plx';
import { Transport, error } from '@coolwallet/core';
import { Buffer } from 'buffer';

import { hexToByteArray } from './utils';

enum Encoding {
  BASE64 = 'base64',
  HEX = 'hex',
}

class RNBleTransport extends Transport {
  private commandCharacteristic?: Characteristic;

  private dataCharacteristic?: Characteristic;

  private statusCharacteristic?: Characteristic;

  private responseCharacteristic?: Characteristic;

  constructor(
    device: BluetoothDevice,
    commandCharacteristic: Characteristic,
    dataCharacteristic: Characteristic,
    statusCharacteristic: Characteristic,
    responseCharacteristic: Characteristic
  ) {
    super(device);
    this.commandCharacteristic = commandCharacteristic;
    this.dataCharacteristic = dataCharacteristic;
    this.statusCharacteristic = statusCharacteristic;
    this.responseCharacteristic = responseCharacteristic;
  }

  sendCommandToCard = async (command: number[]): Promise<void> => {
    try {
      const base64Command = Buffer.from(command).toString(Encoding.BASE64);
      await this.commandCharacteristic?.writeWithResponse(base64Command);
    } catch (e) {
      const bleError = e as BleError;
      throw new error.TransportError(
        this.sendCommandToCard.name,
        `sendCommandToCard DisconnectedDeviceDuringOperation(${bleError.message})`
      );
    }
  };

  sendDataToCard = async (packets: number[]): Promise<void> => {
    try {
      const base64Command = Buffer.from(packets).toString(Encoding.BASE64);
      await this.dataCharacteristic?.writeWithResponse(base64Command);
    } catch (e) {
      const bleError = e as BleError;
      throw new error.TransportError(
        this.sendCommandToCard.name,
        `sendDataToCard DisconnectedDeviceDuringOperation(${bleError.message})`
      );
    }
  };

  checkCardStatus = async (): Promise<number> => {
    try {
      const status = await this.statusCharacteristic?.read();
      const hexStatus = Buffer.from(status?.value ?? '', Encoding.BASE64).toString(Encoding.HEX);
      return hexToByteArray(hexStatus)[0];
    } catch (e) {
      const bleError = e as BleError;
      throw new error.TransportError(
        this.checkCardStatus.name,
        `checkCardStatus DisconnectedDeviceDuringOperation(${bleError.message})`
      );
    }
  };

  readDataFromCard = async (): Promise<number[]> => {
    try {
      const status = await this.responseCharacteristic?.read();
      const hexStatus = Buffer.from(status?.value ?? '', Encoding.BASE64).toString(Encoding.HEX);
      return hexToByteArray(hexStatus);
    } catch (e) {
      const bleError = e as BleError;
      throw new error.TransportError(
        this.checkCardStatus.name,
        `checkCardStatus DisconnectedDeviceDuringOperation(${bleError.message})`
      );
    }
  };
}

export default RNBleTransport;
