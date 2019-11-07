import {
  PACKET_DATA_SIZE,
  MCU_FINISH_CODE,
  COMMAND_FINISH_CODE
} from "../Constants";

let timeoutId: number;
let isFinish = false;
let resultPromise: {
  resolve: (value?: string | PromiseLike<string>) => void,
  reject: (reason?: any) => void
};

const isFinalPart = (index: number, data): boolean => {
  return (index + 1) * PACKET_DATA_SIZE > data.length;
}

const slicePackets = (index: number, packets): string => {
  const dataStartIndex = index * PACKET_DATA_SIZE;
  const dataEndindex = (index + 1) * PACKET_DATA_SIZE;
  const data = packets.slice(dataStartIndex, dataEndindex);
  return data;
}

const _sendDataToCard = async (sendDataToCard, packets, index = 0) => {
  if (packets.length === 0) {
    return
  }
  const data = slicePackets(index, packets);

  await sendDataToCard([index + 1, data.length, ...data]);

  if (!isFinalPart(index + 1, data)) {
    return _sendDataToCard(sendDataToCard, packets, index + 1)
  }
}

const _readDataFromCard = async (readDataFromCard, prev = '', nextPackageSN = 1, retryTimes = 0) => {
  const resultDataRaw = await readDataFromCard();
  const resultData = byteArrayToHex(resultDataRaw);
  if (resultData === MCU_FINISH_CODE) {
    return prev
  } else {
    return _readDataFromCard(readDataFromCard, prev + resultData.slice(4), nextPackageSN + 1)
  }
}

const _checkCardStatus = async (checkCardStatus, readDataFromCard) => {
  clearTimeout(timeoutId);
  if (isFinish)
    return;

  const status = await checkCardStatus();
  if (status === COMMAND_FINISH_CODE) {
    isFinish = true;
    try {
      const resultFromCard = await _readDataFromCard(readDataFromCard);
      resultPromise.resolve(resultFromCard);
    } catch (error) {
      resultPromise.reject(error)
    }
    resultPromise = null
  } else {
    timeoutId = setTimeout(() => {
      _checkCardStatus(checkCardStatus, readDataFromCard)
    }, 1000)
  }
}

const checkCardStatusAndReadDataFromCard = (checkCardStatus, readDataFromCard) => new Promise<string>((resolve, reject) => {
  resultPromise = {
    resolve,
    reject
  };
  _checkCardStatus(checkCardStatus, readDataFromCard);
})

export const sendAPDU = async (
  sendCommandToCard: (commands: number[]) => Promise<void>,
  sendDataToCard: (packets: number[]) => Promise<void>,
  checkCardStatus: () => Promise<number>,
  readDataFromCard: () => Promise<string>,
  command: string,
  packets: string,
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

const byteArrayToHex = (byteArray: number[]): string => {
  return byteArray.map((byte) => {
    return byeToHex(byte)
  }).join('')
}

const byeToHex = (byte: number): string => {
  return (byte < 16 ? '0' : '') + byte.toString(16);
}

const hexToByteArray = (hex: string): number[] => {
  if (!hex) {
    return [];
  }
  let byteArray = [];
  let length = hex.length;
  for (let i = 0; i < length; i += 2) {
    byteArray.push(parseInt(hex.substr(i, 2), 16))
  }
  return byteArray;
}
