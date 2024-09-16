// no-await-in-loop is disabled here due to its intention to allow the user has full advantage of the parallelization benefits of async/await.
// Sending the data sequentially is more preferred than sending the data parallel.

/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import { delay } from '../../utils';
import { BleTransport } from '../../transport';
import { MCU_FINISH_CODE, COMMAND_FINISH_CODE, PACKET_DATA_SIZE } from '../constants';
import { byteArrayToHex, hexToByteArray } from './utils';

/**
 * PeripheralRequest is responsible for peripheral data communication.
 * @class
 *
 * @param {BleTransport} transport internal transport, which must be specified with different platforms
 * @param {boolean} isFinish since the device can only accept one kind of command once, a flag is needed to determine whether another command is executing.
 */
export default class PeripheralRequest {
  private transport: BleTransport;

  private isFinish = true;

  constructor(transport: BleTransport) {
    this.transport = transport;
  }

  /**
   * Split the data into array and send them to card separately.
   * The maximum length of each chunk is PACKET_DATA_SIZE.
   * @param {number[]} packets data in byte form
   * @returns
   */
  private async sendDataToCard(packets: number[]) {
    for (let pivot = 0; pivot * PACKET_DATA_SIZE < packets.length; pivot += 1) {
      const from = pivot * PACKET_DATA_SIZE;
      const to = from + PACKET_DATA_SIZE;
      const data = packets.slice(from, to);
      console.debug('_sendDataToCard data', data);
      await this.transport.sendDataToCard([pivot + 1, data.length, ...data]);
    }
  }

  /**
   * Read data from card until we meet the MCU_FINISH_CODE.
   * @param {string} prev previous data string
   * @returns {Promise<string>}
   */
  private readDataFromCard = async (): Promise<string> => {
    let depot = '';
    while (true) {
      const resultDataRaw = await this.transport.readDataFromCard();
      const resultData = byteArrayToHex(resultDataRaw);
      console.debug('_readDataFromCard resultData', resultData);
      if (resultData === MCU_FINISH_CODE) {
        return depot;
      }
      // The result data will start with four bytes `${packetCount}${dataLength}`.
      depot += resultData.slice(4);
    }
  };

  /**
   * Polling card status.
   * Will start to read bluetooth device data if card status equals to COMMAND_FINISH_CODE.
   * @returns {Promise<string>}
   */
  private checkCardStatus = async () => {
    while (true) {
      if (this.isFinish) return '';
      const statusCode = await this.transport.checkCardStatus();
      console.debug('_checkCardStatus statusCode', statusCode);
      if (statusCode === COMMAND_FINISH_CODE) {
        this.isFinish = true;
        return this.readDataFromCard();
      }
      await delay(1000);
    }
  };

  /**
   * Will send some byte commands then send some arguments.
   * After this, use checkCardStatus to poll the bluetooth device.
   * @param {string} command
   * @param {string} packets
   * @returns  {Promise<string>}
   */
  sendAPDU = async (command: string, packets: string): Promise<string> => {
    const bytesCommand = hexToByteArray(command);
    console.debug('sendCommandToCard statusCode', command);
    this.isFinish = false;
    await this.transport.sendCommandToCard(bytesCommand);

    const bytesPackets = hexToByteArray(packets);
    if (!isNil(bytesPackets) && !isEmpty(bytesPackets)) {
      await this.sendDataToCard(bytesPackets);
    }

    return this.checkCardStatus();
  };
}
