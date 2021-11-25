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
 * // checkCardStatus will use statusCharacteristic to read value from card.
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
    const data = await this.peripheral.sendAPDU(command, packets);
    return data;
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
  listen(): Promise<TransportDevice>;

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
