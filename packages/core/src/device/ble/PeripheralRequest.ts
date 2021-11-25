// We disable no-await-in-loop here.
// Because no-await-in-loop intend to let user have full advantage of the parallelization benefits of async/await.
// But we would like to send them sequentially rather than send them parallel.

/* eslint-disable no-await-in-loop */
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import { delay } from '../../utils';
import Transport from '../../transport';
import { MCU_FINISH_CODE, COMMAND_FINISH_CODE, PACKET_DATA_SIZE } from '../constants';
import { byteArrayToHex, hexToByteArray } from './utils';

/**
 * PeripheralRequest is responsible for peripheral data communication.
 * @class
 *
 * @param {Transport} transport internal transport, which must be specified with different platforms
 * @param {boolean} isFinish since our device can only accept one kind of command once, we should have a flag to determine whether another command is executing.
 */
export default class PeripheralRequest {
  private transport: Transport;

  private isFinish = false;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  /**
   * Send data to card chunk by chunk.
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
   * Read data from card recursively until we meet the MCU_FINISH_CODE.
   * @param {string} prev previous data string
   * @returns {Promise<string>}
   */
  private readDataFromCard = async (prev = ''): Promise<string> => {
    const resultDataRaw = await this.transport.readDataFromCard();
    const resultData = byteArrayToHex(resultDataRaw);
    console.debug('_readDataFromCard resultData', resultData);
    if (resultData === MCU_FINISH_CODE) {
      return prev;
    }
    return this.readDataFromCard(prev + resultData.slice(4));
  };

  /**
   * Polling card status.
   * Will Start to read bluetooth device data if card status equals to COMMAND_FINISH_CODE.
   * @returns {Promise<void>}
   */
  private checkCardStatus = async () => {
    while (true) {
      if (this.isFinish) return '';
      const statusCode = await this.transport.checkCardStatus();
      console.debug('_checkCardStatus statusCode', statusCode);
      if (statusCode === COMMAND_FINISH_CODE) {
        this.isFinish = true;
        const resultFromCard = await this.readDataFromCard();
        return resultFromCard;
      }
      await delay(1000);
    }
  };

  /**
   * Will send some byte commands then send some arguments.
   * After this, we will start to poll our bluetooth device with checkCardStatus.
   * @param {string} command
   * @param {string} packets
   * @returns  {Promise<string>}
   */
  sendAPDU = async (command: string, packets: string): Promise<string> => {
    const bytesCommand = hexToByteArray(command);
    await this.transport.sendCommandToCard(bytesCommand);

    const bytesPackets = hexToByteArray(packets);
    if (!isNil(bytesPackets) && !isEmpty(bytesPackets)) {
      await this.sendDataToCard(bytesPackets);
    }

    this.isFinish = false;
    const result = await this.checkCardStatus();
    return result;
  };
}
