import {
  BleManager,
  BleErrorCode,
} from "react-native-ble-plx";


import { device as coreDevice } from '@coolwallet/core';

import { Buffer } from 'buffer';

import { transport, error } from "@coolwallet/core";

import { convertToNumberArray } from "./util";

const bleManager = new BleManager();

let writeCharacteristic;
let dataCharacteristic;
let checkCharacteristic;
let readCharacteristic;

const retrieveInfos = services => {
  if (!services || services.length === 0) return;
  let infos;
  services.map(service => {
    const info = coreDevice.getInfosForServiceUuid(service.uuid);
    if (info && !infos) {
      infos = info;
    }
  });
  if (!infos) return;
  return infos;
};

export default class RNBleTransport extends transport.default {

  static isSupported = () =>
    Promise.resolve(typeof BleManager === "function");

  static setLogLevel = (level) => {
    bleManager.setLogLevel(level);
  };

  static async listen(callback) {
    let unsubscribed;

    const stateSub = bleManager.onStateChange(async state => {
      if (state === "PoweredOn") {
        stateSub.remove();

        const devices = await bleManager.connectedDevices(
          coreDevice.getBluetoothServiceUuids()
        );
        if (unsubscribed) return;

        await Promise.all(
          devices.map(d => BluetoothTransport.disconnect(d.id).catch(() => { }))
        );
        if (unsubscribed) return;

        bleManager.startDeviceScan(
          coreDevice.getBluetoothServiceUuids(),
          null,
          (bleError, device) => {
            if (bleError) {
              callback(bleError, null);
              unsubscribe();
              return;
            }
            callback(null, { name: device.name, id: device.id });
          }
        );
      }
    }, true);
    const unsubscribe = () => {
      unsubscribed = true;
      bleManager.stopDeviceScan();
      stateSub.remove();
    };
    return { unsubscribe };
  }

  static async connect(deviceOrId) {
    let device;
    if (typeof deviceOrId === "string") {
      if (!device) {
        // works for iOS but not Android
        const devices = await bleManager.devices([deviceOrId]);
        [device] = devices;
      }

      if (!device) {
        const connectedDevices = await bleManager.connectedDevices(
          coreDevice.getBluetoothServiceUuids()
        );
        const connectedDevicesFiltered = connectedDevices.filter(
          d => d.id === deviceOrId
        );
        [device] = connectedDevicesFiltered;
      }

      if (!device) {
        try {
          device = await bleManager.connectToDevice(deviceOrId);
        } catch (e) {
          if (e.errorCode === BleErrorCode.DeviceMTUChangeFailed) {
            device = await bleManager.connectToDevice(deviceOrId);
          } else {
            throw e;
          }
        }
      }

      if (!device) {
        throw new error.TransportError(this.connect.name, 'cant open deivce');
      }
    } else {
      device = deviceOrId;
    }

    if (!(await device.isConnected())) {
      await device.connect();
    }

    const serviceDevice = await device.discoverAllServicesAndCharacteristics();
    const services = await serviceDevice.services();
    let res = retrieveInfos(services);
    const serviceUuids = coreDevice.getBluetoothServiceUuids();
    let characteristics;
    if (!res) {
      for (let i = 0; i < serviceUuids.length; i++) {
        try {
          characteristics = await device.characteristicsForService(serviceUuids[i]);
          res = coreDevice.getInfosForServiceUuid(serviceUuids[i]);
          break;
        } catch (e) {
          console.log('bleTransport e', e);
          // we attempt to connect to service
        }
      }
    }
    if (!res) {
      throw new error.TransportError(this.connect.name, 'service not found');
    }

    const {
      serviceUuid,
      writeUuid,
      dataUuid,
      checkUuid,
      readUuid
    } = res;

    if (!characteristics) {
      characteristics = await device.characteristicsForService(serviceUuid);
    }

    if (!characteristics) {
      throw new error.TransportError(this.connect.name, 'service not found');
    }

    for (const c of characteristics) {
      if (c.uuid === writeUuid) {
        writeCharacteristic = c;
      } else if (c.uuid === dataUuid) {
        dataCharacteristic = c;
      } else if (c.uuid === checkUuid) {
        checkCharacteristic = c;
      } else if (c.uuid === readUuid) {
        readCharacteristic = c;
      }
    }
    if (!writeCharacteristic) {
      throw new error.TransportError(this.connect.name, 'writeCharacteristic not found');
    }
    if (!dataCharacteristic) {
      throw new error.TransportError(this.connect.name, 'dataCharacteristic not found');
    }
    if (!checkCharacteristic) {
      throw new error.TransportError(this.connect.name, 'checkCharacteristic not found');
    }
    if (!readCharacteristic) {
      throw new error.TransportError(this.connect.name, 'readCharacteristic not found');
    }

    const transport = new RNBleTransport(
      device,
      this.sendCommandToCard,
      this.sendDataToCard,
      this.checkCardStatus,
      this.readDataFromCard
    );

    const onDisconnect = () => {
      transport.notYetDisconnected = false;
      disconnectedSub.remove();
    };

    const disconnectedSub = device.onDisconnected(e => {
      if (!transport.notYetDisconnected) return;
      onDisconnect(e);
    });

    return transport;
  }

  static disconnect = async (id) => {
    await bleManager.cancelDeviceConnection(id);
  };

  notYetDisconnected = true;

  constructor(
    device,
    sendCommandToCard,
    sendDataToCard,
    checkCardStatus,
    readDataFromCard) {
    super(
      device,
      sendCommandToCard,
      sendDataToCard,
      checkCardStatus,
      readDataFromCard
    )
  }

  sendCommandToCard = async (command) => {
    try {
      const base64Command = new Buffer(command).toString('base64');
      await writeCharacteristic.writeWithResponse(base64Command);
    } catch (e) {
      throw new error.TransportError(this.sendCommandToCard.name, `sendCommandToCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  sendDataToCard = async (packets) => {
    try {
      const base64Packets = new Buffer(packets).toString('base64');
      await dataCharacteristic.writeWithResponse(base64Packets);
    } catch (e) {
      throw new error.TransportError(this.sendDataToCard.name, `sendDataToCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  checkCardStatus = async () => {
    try {
      const status = await checkCharacteristic.read();
      const hexStatus = Buffer.from(status.value, 'base64').toString('hex');
      return convertToNumberArray(hexStatus)[0];
    } catch (e) {
      throw new error.TransportError(this.checkCardStatus.name, `checkCardStatus DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  readDataFromCard = async () => {
    try {
      const result = await readCharacteristic.read();
      const hexResult = Buffer.from(result.value, 'base64').toString('hex');
      return convertToNumberArray(hexResult);
    } catch (e) {
      throw new error.TransportError(this.readDataFromCard.name, `readDataFromCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };
}
