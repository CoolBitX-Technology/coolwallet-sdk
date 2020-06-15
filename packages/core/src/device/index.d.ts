export type DeviceModelId = string;

export type DeviceModel = {
  id: string,
  productName: string,
  bluetoothSpec?: Array<{
    serviceUuid: string,
    writeUuid: string,
    dataUuid: string,
    checkUuid: string,
    readUuid: string
  }>
};

export type BluetoothInfos = {
  deviceModel: DeviceModel,
  serviceUuid: string,
  writeUuid: string,
  dataUuid: string,
  checkUuid: string,
  readUuid: string
};

export function getBluetoothServiceUuids(): string[];

export function getInfosForServiceUuid(uuid: string): BluetoothInfos;