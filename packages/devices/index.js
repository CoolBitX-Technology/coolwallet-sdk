export * from './ble/sendAPDU';

const devices = {
  cws: {
    id: 'cws',
    productName: 'CoolWallets',
    bluetoothSpec: [
      {
        serviceUuid: '0000a000-0000-1000-8000-00805f9b34fb',
        writeUuid: '0000a007-0000-1000-8000-00805f9b34fb',
        dataUuid: '0000a008-0000-1000-8000-00805f9b34fb',
        checkUuid: '0000a006-0000-1000-8000-00805f9b34fb',
        readUuid: '0000a009-0000-1000-8000-00805f9b34fb'
      }
    ]
  }
};

let bluetoothServices = [];
const serviceUuidToInfos = {};

for (let id in devices) {
  const deviceModel = devices[id];
  const { bluetoothSpec } = deviceModel;
  if (bluetoothSpec) {
    for (let i = 0; i < bluetoothSpec.length; i++) {
      const spec = bluetoothSpec[i];
      bluetoothServices.push(spec.serviceUuid);
      serviceUuidToInfos[spec.serviceUuid] = serviceUuidToInfos[
        spec.serviceUuid.replace(/-/g, '')
      ] = { deviceModel, ...spec };

    }
  }
}

export const getBluetoothServiceUuids = () => {
  return bluetoothServices
};

export const getInfosForServiceUuid = (uuid) => {
  return serviceUuidToInfos[uuid.toLowerCase()];
}