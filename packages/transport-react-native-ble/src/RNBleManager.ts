import { BleManager, BleErrorCode, Device as BluetoothDevice, State } from 'react-native-ble-plx';
import { Transport, BleManager as CoreBleManager, device as coreDevice, error } from '@coolwallet/core';
import isNil from 'lodash/isNil';
import last from 'lodash/last';
import type { BleError, Subscription } from 'react-native-ble-plx';
import RNBleTransport from './RNBleTransport';

type Optional<T> = T | null | undefined;

class RNBleManager implements CoreBleManager {
  transport?: Transport;

  bleManager: BleManager;

  uuids: string[];

  stateSubscription?: Subscription;

  constructor() {
    this.bleManager = new BleManager();
    this.uuids = coreDevice.getBluetoothServiceUuids();
  }

  /**
   * Check whether platforms support bluetooth.
   *
   * @returns {Promise<boolean>}
   */
  async isSupported(): Promise<boolean> {
    const supported = (await this.bleManager.state()) === State.PoweredOn;
    return supported;
  }

  listen(callback?: (error?: BleError, device?: BluetoothDevice) => void): void {
    this.stateSubscription = this.bleManager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        this.scanAndConnect(callback);
        this.stateSubscription?.remove();
      }
    }, true);
  }

  scanAndConnect = async (callback?: (error?: BleError, device?: BluetoothDevice) => void): Promise<void> => {
    await this.disconnect();
    this.bleManager.startDeviceScan(this.uuids, null, (bleError, device) => {
      if (!isNil(bleError)) {
        callback?.(bleError, undefined);
        return;
      }
      if (!isNil(device)) {
        callback?.(undefined, device);
      }
    });
  };

  stopListen?(): void {
    this.stateSubscription?.remove();
    this.bleManager.stopDeviceScan();
  }

  connect = async (device: BluetoothDevice): Promise<Transport> => {
    let connectedDevice: Optional<BluetoothDevice>;

    try {
      connectedDevice = await this.bleManager.connectToDevice(device.id);
    } catch (e) {
      if ((e as BleError).errorCode === BleErrorCode.DeviceMTUChangeFailed) {
        connectedDevice = await this.bleManager.connectToDevice(device.id);
      } else {
        throw e;
      }
    }

    if (isNil(connectedDevice)) {
      throw new error.TransportError(this.connect.name, 'can not open device');
    }

    const isConnected = await connectedDevice.isConnected();
    if (isConnected) {
      await connectedDevice.connect();
    }
    const serviceDevices = await connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await serviceDevices.services();
    const characteristics = await Promise.all(
      services.map(async (service) => {
        const { uuid } = service;
        const serviceUuid = coreDevice.getInfosForServiceUuid(uuid);
        if (isNil(serviceUuid)) return null;
        const servicesCharacteristic = await connectedDevice?.characteristicsForService(uuid);
        if (isNil(servicesCharacteristic)) throw new error.TransportError(this.connect.name, 'service not found');
        const commandCharacteristic = servicesCharacteristic.find((c) => c.uuid === serviceUuid.writeUuid);
        const dataCharacteristic = servicesCharacteristic.find((c) => c.uuid === serviceUuid.dataUuid);
        const statusCharacteristic = servicesCharacteristic.find((c) => c.uuid === serviceUuid.checkUuid);
        const responseCharacteristic = servicesCharacteristic.find((c) => c.uuid === serviceUuid.readUuid);
        const result = {
          commandCharacteristic,
          dataCharacteristic,
          statusCharacteristic,
          responseCharacteristic,
        };
        // Check whether any characteristic is null
        if (Object.values(result).some(isNil)) return null;

        return result;
      })
    ).then((res) => res.filter((r) => !isNil(r)));

    const characteristic = last(characteristics);
    if (isNil(characteristics)) throw new error.TransportError(this.connect.name, 'characteristic not found');

    const commandCharacteristic = characteristic?.commandCharacteristic;
    const dataCharacteristic = characteristic?.dataCharacteristic;
    const statusCharacteristic = characteristic?.statusCharacteristic;
    const responseCharacteristic = characteristic?.responseCharacteristic;
    if (isNil(commandCharacteristic)) {
      throw new error.TransportError(this.connect.name, 'commandCharacteristic not found');
    }
    if (isNil(dataCharacteristic)) {
      throw new error.TransportError(this.connect.name, 'dataCharacteristic not found');
    }
    if (isNil(statusCharacteristic)) {
      throw new error.TransportError(this.connect.name, 'statusCharacteristic not found');
    }
    if (isNil(responseCharacteristic)) {
      throw new error.TransportError(this.connect.name, 'responseCharacteristic not found');
    }

    this.transport = new RNBleTransport(
      device,
      commandCharacteristic,
      dataCharacteristic,
      statusCharacteristic,
      responseCharacteristic
    );
    return this.transport;
  };

  /**
   * Disconnect the specific device by id.
   *
   * @param id device id.
   * @returns {Promise<void>}
   */
  disconnectedById = async (id: string): Promise<void> => {
    await this.bleManager.cancelDeviceConnection(id);
  };

  /**
   * Disconnect all devices that bleManager connected.
   */
  disconnect = async (): Promise<void> => {
    // Get all connected bluetooth devices and disconnect them.
    const connectedDevices = await this.bleManager.connectedDevices(this.uuids);
    await Promise.all(connectedDevices.map(({ id }) => this.disconnectedById(id)));
  };
}

export default RNBleManager;
