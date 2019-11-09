import Transport from '@coolwallets/transport';
import { getBluetoothServiceUuids, getInfosForServiceUuid } from "@coolwallets/devices";

let server;
let commandCharacteristic;
let dataCharacteristic;
let statusCharacteristic;
let responseCharacteristic;

export default class WebBleTransport extends Transport {
  constructor(device,
    sendCommandToCard,
    sendDataToCard,
    checkCardStatus,
    readCharacteristic) {
    super(
      device,
      sendCommandToCard,
      sendDataToCard,
      checkCardStatus,
      readCharacteristic
    )
  }

  static async isSupported() {
    const isSupported = await navigator.bluetooth.getAvailability();
    return isSupported;
  }

  static async listen(callback) {
    try {
      const services = getBluetoothServiceUuids();
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services }] });
      callback(null, device);
    } catch (error) {
      callback(error, null);
    }
  }

  static async connect(device) {
    device.addEventListener('gattserverdisconnected', this._onDeviceDisconnect)
    server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    const service = services[0];
    const uuids = getInfosForServiceUuid(service.uuid);
    commandCharacteristic = await service.getCharacteristic(uuids.writeUuid);
    dataCharacteristic = await service.getCharacteristic(uuids.dataUuid);
    statusCharacteristic = await service.getCharacteristic(uuids.checkUuid);
    responseCharacteristic = await service.getCharacteristic(uuids.readUuid);

    const transport = new WebBleTransport(
      device,
      this.sendCommandToCard,
      this.sendDataToCard,
      this.checkCardStatus,
      this.readDataFromCard
    );

    return transport;
  }

  static async disconnect(device) {
    if (server) await server.disconnect()
    server = undefined
    commandCharacteristic = undefined
    dataCharacteristic = undefined
    statusCharacteristic = undefined
    responseCharacteristic = undefined
  }

  async _onDeviceDisconnect(event) {
    console.log('Device ' + event.target.name + ' is disconnected.');
  }

  sendCommandToCard = async (command) => {
    await commandCharacteristic.writeValue(new Uint8Array(command));
  }

  sendDataToCard = async (packets) => {
    await dataCharacteristic.writeValue(new Uint8Array(packets));
  }

  checkCardStatus = async () => {
    console.log('checkCardStatus')
    const status = await statusCharacteristic.readValue();
    return status;
  }

  readDataFromCard = async () => {
    console.log('readDataFromCard')
    const response = await responseCharacteristic.readValue();
    return response;
  }
}
