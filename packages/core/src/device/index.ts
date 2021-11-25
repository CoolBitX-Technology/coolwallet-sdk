export type BluetoothSpec = {
  serviceUuid: string;
  writeUuid: string;
  dataUuid: string;
  checkUuid: string;
  readUuid: string;
};

export type DeviceModel = {
  id: string;
  productName: string;
  bluetoothSpec?: Array<BluetoothSpec>;
};

export type Device = {
  [cws: string]: DeviceModel;
};

export type BluetoothInfos = {
  deviceModel: DeviceModel;
} & BluetoothSpec;

const devices: Device = {
  cws: {
    id: 'cws',
    productName: 'CoolWallets',
    bluetoothSpec: [
      {
        serviceUuid: '0000a000-0000-1000-8000-00805f9b34fb',
        writeUuid: '0000a007-0000-1000-8000-00805f9b34fb',
        dataUuid: '0000a008-0000-1000-8000-00805f9b34fb',
        checkUuid: '0000a006-0000-1000-8000-00805f9b34fb',
        readUuid: '0000a009-0000-1000-8000-00805f9b34fb',
      },
    ],
  },
};

const [serviceUuidToInfos, bluetoothServices] = Object.keys(devices).reduce(
  (memo, id) => {
    const deviceModel = devices[id];
    const bluetoothSpec = deviceModel.bluetoothSpec ?? [];
    bluetoothSpec.forEach((spec) => {
      memo[1].push(spec.serviceUuid);
      // eslint-disable-next-line
      memo[0][spec.serviceUuid] = memo[0][spec.serviceUuid.replace(/-/g, '')] = { deviceModel, ...spec };
    });

    return memo;
  },
  [{}, []] as [Record<string, any>, string[]]
);

export const getBluetoothServiceUuids = (): string[] => bluetoothServices;

export const getInfosForServiceUuid = (uuid: string): BluetoothInfos => serviceUuidToInfos[uuid.toLowerCase()];
