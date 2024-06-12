/// <reference types="web-bluetooth" />
import type { Device as RNBlePlxDevice } from 'react-native-ble-plx';
import PeripheralRequest from '../device/ble/PeripheralRequest';

type TransportDevice = BluetoothDevice | RNBlePlxDevice;

/**
 * Transport is an abstract class.
 * All class that implement this abstract class will need to implements following methods:
 *
 * @example
 * // sendCommandToCard will be responsible for sending a byte array by commandCharacteristic.
 * abstract sendCommandToCard(command: number[]): Promise<void>;
 *
 * @example
 * // sendCommandToCard will be responsible for sending a byte array by dataCharacteristic.
 * abstract sendDataToCard(packets: number[]): Promise<void>;
 *
 * @example
 * // checkCardStatus will use statusCharacteristic to read value from card.
 * // But only take the first element of read value.
 * abstract checkCardStatus(): Promise<number>;
 *
 * @example
 * // readDataFromCard will use responseCharacteristic to read value from card.
 * readDataFromCard(): Promise<number[]>;
 */
abstract class Transport {
  [key: string]: any;

  peripheral: PeripheralRequest;

  device: TransportDevice;

  constructor(device: TransportDevice) {
    this.device = device;
    this.peripheral = new PeripheralRequest(this);
  }

  abstract sendCommandToCard(command: number[]): Promise<void>;

  abstract sendDataToCard(packets: number[]): Promise<void>;

  abstract checkCardStatus(): Promise<number>;

  abstract readDataFromCard(): Promise<number[]>;

  request = async (command: string, packets: string): Promise<string> => {
    return this.peripheral.sendAPDU(command, packets);
  };
}

interface BleManager {
  /**
   * Check whether browser support bluetooth.
   */
  isSupported(): Promise<boolean>;

  /**
   * Scan device in order to get the BluetoothDevice instance.
   */
  listen(callback?: (error?: any, device?: TransportDevice) => void): Promise<TransportDevice> | void;

  /**
   * Stop scanning BluetoothDevice.
   *
   * Optional, it is not required to every platform, ex. browser.
   */
  stopListen?(): void;

  /**
   * Connect to given TransportDevice and return the Transport.
   */
  connect(device: TransportDevice): Promise<Transport>;

  /**
   * Disconnect from Transport and TransportDevice.
   */
  disconnect(): Promise<void>;
}

export { BleManager };
export default Transport;
