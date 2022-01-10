/// <reference types="web-bluetooth" />
import { Transport, BleManager, device as coreDevice } from '@coolwallet/core';
import BleTransport from './WebBleTransport';

enum BleEvents {
  DISCONNECTED = 'gattserverdisconnected',
}

/**
 * Manage browser bluetooth status.
 */
class WebBleManager implements BleManager {
  public transport?: BleTransport;

  private server?: BluetoothRemoteGATTServer;

  /**
   * Check whether browser support bluetooth.
   * For more information: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  async isSupported(): Promise<boolean> {
    return navigator.bluetooth.getAvailability();
  }

  /**
   * Popup browser bluetooth selector.
   * @returns {Promise<BluetoothDevice>} selected BluetoothDevice.
   */
  // eslint-disable-next-line class-methods-use-this
  listen(): Promise<BluetoothDevice> {
    return new Promise((resolve, reject) => {
      const services = coreDevice.getBluetoothServiceUuids();
      navigator.bluetooth
        .requestDevice({
          filters: [{ services }],
        })
        .then(resolve, reject);
    });
  }

  /**
   * Connected to the given BluetoothDevice and create internal transport.
   * @param device BluetoothDevice which should be connected.
   * @returns {Transport}
   */
  async connect(device: BluetoothDevice): Promise<Transport> {
    this.setOnDisconnect(device, this.onDeviceDisconnect);
    this.server = await device.gatt?.connect();
    console.info(`${device.name} connected`);
    const [service] = await this.server!.getPrimaryServices();
    const uuids = coreDevice.getInfosForServiceUuid(service.uuid);
    const commandCharacteristic = await service.getCharacteristic(uuids.writeUuid);
    const dataCharacteristic = await service.getCharacteristic(uuids.dataUuid);
    const statusCharacteristic = await service.getCharacteristic(uuids.checkUuid);
    const responseCharacteristic = await service.getCharacteristic(uuids.readUuid);

    this.transport = new BleTransport(
      device,
      commandCharacteristic,
      dataCharacteristic,
      statusCharacteristic,
      responseCharacteristic
    );

    return this.transport;
  }

  /**
   * Disconnect from the BluetoothRemoteGATTServer and remove internal transport.
   */
  async disconnect(): Promise<void> {
    if (this.server) await this.server.disconnect();
    this.server = undefined;
    this.transport = undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  setOnDisconnect(device: BluetoothDevice, onDisconnect: (event: Event) => void): void {
    device.addEventListener(BleEvents.DISCONNECTED, onDisconnect);
  }

  // eslint-disable-next-line class-methods-use-this
  onDeviceDisconnect(event: Event): void {
    console.debug(`Device ${(event.target as BluetoothDevice).name} is disconnected.`);
  }
}

export default WebBleManager;
