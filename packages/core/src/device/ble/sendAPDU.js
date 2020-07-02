/* eslint-disable no-underscore-dangle */
import {
  PACKET_DATA_SIZE,
  MCU_FINISH_CODE,
  COMMAND_FINISH_CODE
} from '../Constants';

let isFinish = false;
let resultPromise = {};
let timeoutId;
/**
 * @param {number} index
 * @param {number[]} packets
 * @returns {boolean}
 */
const isLastPacket = (index, packets) => (index) * PACKET_DATA_SIZE > packets.length;

/**
 * @param {number} index
 * @param {number[]} packets
 * @returns {number[]}
 */
const slicePackets = (index, packets) => {
  const dataStartIndex = index * PACKET_DATA_SIZE;
  const dataEndindex = (index + 1) * PACKET_DATA_SIZE;
  const data = packets.slice(dataStartIndex, dataEndindex);
  return data;
};

/**
 * @param {(command:number[])=>Promise<void>} sendDataToCard
 * @param {number[]} packets
 * @param {number} index
 * @returns {void}
 */
const _sendDataToCard = async (sendDataToCard, packets, index = 0) => {
  if (packets.length === 0) {
    return;
  }
  const data = slicePackets(index, packets);
  console.debug('_sendDataToCard data', data);
  await sendDataToCard([index + 1, data.length, ...data]);

  if (!isLastPacket(index + 1, packets)) {
    return _sendDataToCard(sendDataToCard, packets, index + 1);
  }
};

/**
 * @param {()=>Promise<number[]>} readDataFromCard
 * @param {string} prev
 * @param {number} index
 * @returns {string}
 */
const _readDataFromCard = async (readDataFromCard, prev = '') => {
  const resultDataRaw = await readDataFromCard();
  const resultData = byteArrayToHex(resultDataRaw);
  console.debug('_readDataFromCard resultData', resultData);
  if (resultData === MCU_FINISH_CODE) {
    return prev;
  }
  return _readDataFromCard(readDataFromCard, prev + resultData.slice(4));
};

/**
 * @param {()=>Promise<number>} checkCardStatus
 * @param {()=>Promise<number[]>} readDataFromCard
 * @returns {void}
 */
const _checkCardStatus = async (checkCardStatus, readDataFromCard) => {
  clearTimeout(timeoutId);
  if (isFinish) { return; }

  const statusCode = await checkCardStatus();
  console.debug('_checkCardStatus statusCode', statusCode);
  if (statusCode === COMMAND_FINISH_CODE) {
    isFinish = true;
    try {
      const resultFromCard = await _readDataFromCard(readDataFromCard);
      resultPromise.resolve(resultFromCard);
    } catch (error) {
      resultPromise.reject(error);
    }
    resultPromise = null;
  } else {
    timeoutId = setTimeout(() => {
      _checkCardStatus(checkCardStatus, readDataFromCard);
    }, 1000);
  }
};

/**
 * @param {()=>Promise<number>} checkCardStatus
 * @param {()=>Promise<number[]>} readDataFromCard
 * @returns {void}
 */
const checkCardStatusAndReadDataFromCard = (checkCardStatus, readDataFromCard) => new Promise((resolve, reject) => {
  resultPromise = {
    resolve,
    reject
  };
  _checkCardStatus(checkCardStatus, readDataFromCard);
});

/**
 * @param {(command:number[])=>Promise<void>} sendCommandToCard
 * @param {(packets:number[])=>Promise<void>} sendDataToCard
 * @param {()=>Promise<number>} checkCardStatus
 * @param {()=>Promise<number[]>} readDataFromCard
 * @param {string} command
 * @param {string} packets
 * @returns {string}
 */
export const sendAPDU = async (
  sendCommandToCard,
  sendDataToCard,
  checkCardStatus,
  readDataFromCard,
  command,
  packets
) => {
  const bytesCommand = hexToByteArray(command);
  await sendCommandToCard(bytesCommand);

  const bytesPackets = hexToByteArray(packets);
  if (bytesPackets && bytesPackets.length > 0) {
    await _sendDataToCard(sendDataToCard, bytesPackets);
  }

  isFinish = false;
  const result = await checkCardStatusAndReadDataFromCard(checkCardStatus, readDataFromCard);
  return result;
};

/**
 * @param {number[]} byteArray
 * @returns {string}
 */
const byteArrayToHex = (byteArray) => byteArray.map((byte) => byeToHex(byte)).join('');

/**
 * @param {number} byte
 * @returns {string}
 */
const byeToHex = (byte) => (byte < 16 ? '0' : '') + byte.toString(16);

/**
 * @param {string} hex
 * @returns {number[]}
 */
const hexToByteArray = (hex) => {
  if (!hex) {
    return [];
  }
  const byteArray = [];
  const { length } = hex;
  for (let i = 0; i < length; i += 2) {
    byteArray.push(parseInt(hex.substr(i, 2), 16));
  }
  return byteArray;
};
