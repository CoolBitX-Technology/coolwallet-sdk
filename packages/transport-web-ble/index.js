import { hexStringToByte, convertToHex } from './util'

const PACKET_DATA_SIZE = 18

export class WebBleTransport {
  constructor(verbose = true) {
    this.connected = false

    this.server = undefined
    this.statusCharacteristic = undefined
    this.commandCharacteristic = undefined
    this.dataCharacteristic = undefined
    this.responseCharacteristic = undefined
    this.verbose = verbose
    this.eventPromise

    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.request = this.request.bind(this)

    this._waitForStatusChange = this._waitForStatusChange.bind(this)
    this._onCharateristicStatusChange = this._onCharateristicStatusChange.bind(this)
    this._sendData = this._sendData.bind(this)
    this._readValue = this._readValue.bind(this)
  }

  async connect() {
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [0xa000] }] })
      if (this.verbose) console.log(`found device id: "${device.id}", name: "${device.name}"`)

      // Connect to GATT Server
      device.addEventListener('gattserverdisconnected', this._onDeviceDisconnect)
      this.server = await device.gatt.connect()

      // Get Service
      const services = await this.server.getPrimaryServices()
      const service = services[0]
      if (this.verbose) console.log(`Service uuid: ${service.uuid}`)

      this.commandCharacteristic = await service.getCharacteristic(0xa007)
      this.dataCharacteristic = await service.getCharacteristic(0xa008)
      this.statusCharacteristic = await service.getCharacteristic(0xa006)
      this.responseCharacteristic = await service.getCharacteristic(0xa009)

      await this.statusCharacteristic.startNotifications()
      this.statusCharacteristic.addEventListener('characteristicvaluechanged', this._onCharateristicStatusChange)
      if (this.verbose) console.log('bluetooth connection established.')
      this.connected = true;
    } catch (error) {
      if (this.server) await this.server.disconnect()
      throw error
    }
  }

  /**
   *
   * @param {string} command
   * @param {string} data
   * @returns {string}
   */
  async request(command, data) {
    if (!this.server) throw Error('No Bluetooth Connection.')
    if (this.verbose) console.log(`WebBLE request command: ${command},\tdata: ${data}`)
    const commandBuf = hexStringToByte(command)

    await this.commandCharacteristic.writeValue(commandBuf)

    if (data) {
      this._sendData(hexStringToByte(data))
    }
    await this._waitForStatusChange()
    return await this._readValue()
  }

  async disconnect() {
    if (this.server) await this.server.disconnect()
    this.connected = false
  }

  async _sendData(data) {
    let isFinalPart = false,
      index = 0
    while (!isFinalPart) {
      isFinalPart = (index + 1) * PACKET_DATA_SIZE >= data.length
      const batchdata = data.slice(index * PACKET_DATA_SIZE, (index + 1) * PACKET_DATA_SIZE)
      let packet = new Uint8Array(batchdata.length + 2)
      packet.set(new Uint8Array([index + 1]))
      packet.set(new Uint8Array([batchdata.length]), 1)
      packet.set(batchdata, 2)
      await this.dataCharacteristic.writeValue(packet)
      index = index + 1
    }
  }

  async _readValue() {
    let response = ''
    while (true) {
      let _response = convertToHex(await this.responseCharacteristic.readValue())
      if (_response === 'fc') break
      response = response + _response.slice(4)
    }
    return response
  }

  async _onCharateristicStatusChange() {
    if (this.eventPromise) {
      this.eventPromise.resolve()
    }
  }

  async _onDeviceDisconnect(event) {
    if (this.verbose) console.log('Device ' + event.target.name + ' is disconnected.')
    this.connected = false
  }

  async _waitForStatusChange() {
    return new Promise((resolve, reject) => {
      this.eventPromise = {
        resolve,
        reject,
      }
    })
  }
}
