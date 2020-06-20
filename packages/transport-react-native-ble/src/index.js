import {
  BleManager,
  BleErrorCode,
} from "react-native-ble-plx";

import {
  getBluetoothServiceUuids,
  getInfosForServiceUuid,
} from "@coolwallets/core";

import { Buffer } from 'buffer';

import { transport } from "@coolwallets/core";

import { convertToNumberArray } from "./util";

const transportsCache = {};
const bleManager = new BleManager();

let writeCharacteristic;
let dataCharacteristic;
let checkCharacteristic;
let readCharacteristic;

const retrieveInfos = services => {
  if (!services || services.length === 0) return;
  let infos;
  services.map(service => {
    const info = getInfosForServiceUuid(service.uuid);
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
          getBluetoothServiceUuids()
        );
        if (unsubscribed) return;

        await Promise.all(
          devices.map(d => BluetoothTransport.disconnect(d.id).catch(() => { }))
        );
        if (unsubscribed) return;

        bleManager.startDeviceScan(
          getBluetoothServiceUuids(),
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
      if (transportsCache[deviceOrId]) {
        return transportsCache[deviceOrId];
      }

      if (!device) {
        // works for iOS but not Android
        const devices = await bleManager.devices([deviceOrId]);
        [device] = devices;
      }

      if (!device) {
        const connectedDevices = await bleManager.connectedDevices(
          getBluetoothServiceUuids()
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
        throw new Error('cant open deivce');
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
    const serviceUuids = getBluetoothServiceUuids();
    let characteristics;
    if (!res) {
      for (let i = 0; i < serviceUuids.length; i++) {
        try {
          characteristics = await device.characteristicsForService(serviceUuids[i]);
          res = getInfosForServiceUuid(serviceUuids[i]);
          break;
        } catch (e) {
          console.log('bleTransport e', e);
          // we attempt to connect to service
        }
      }
    }
    if (!res) {
      throw new Error('service not found');
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
      throw new Error('service not found');
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
      throw new Error('writeCharacteristic not found');
    }
    if (!dataCharacteristic) {
      throw new Error('dataCharacteristic not found');
    }
    if (!checkCharacteristic) {
      throw new Error('checkCharacteristic not found');
    }
    if (!readCharacteristic) {
      throw new Error('readCharacteristic not found');
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
      delete transportsCache[transport.device.id];
    };

    // eslint-disable-next-line require-atomic-updates
    transportsCache[transport.device.id] = transport;
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
      throw new Error(`sendCommandToCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  sendDataToCard = async (packets) => {
    try {
      const base64Packets = new Buffer(packets).toString('base64');
      await dataCharacteristic.writeWithResponse(base64Packets);
    } catch (e) {
      throw new Error(`sendDataToCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  checkCardStatus = async () => {
    try {
      const status = await checkCharacteristic.read();
      const hexStatus = Buffer.from(status.value, 'base64').toString('hex');
      return convertToNumberArray(hexStatus)[0];
    } catch (e) {
      throw new Error(`checkCardStatus DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };

  readDataFromCard = async () => {
    try {
      const result = await readCharacteristic.read();
      const hexResult = Buffer.from(result.value, 'base64').toString('hex');
      return convertToNumberArray(hexResult);
    } catch (e) {
      throw new Error(`readDataFromCard DisconnectedDeviceDuringOperation(${e.message})`);
    }
  };
}
