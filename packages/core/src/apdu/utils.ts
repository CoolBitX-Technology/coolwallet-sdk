import { error as Errors } from '../index';

const getCheckSum = (data: any) => {
  let XORTemp = 0;
  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-bitwise
    XORTemp ^= parseInt(data[i], 16);
  }
  let temp = XORTemp.toString(16);
  if (temp.length % 2 !== 0) {
    temp = `0${temp}`;
  }

  return temp;
};

export const assemblyCommandAndData = (
  cla: string,
  ins: string,
  p1: string | undefined,
  p2: string | undefined,
  oriData: string
) => {
  const pid = '00';
  const cmdLen = '09';

  const packetLength = 18;
  let dataLength = 0;
  // flag = true;
  let packets = '';

  if (oriData) {
    packets = oriData;
    const data = packets.match(/.{2}/g);
    const checksum = getCheckSum(data);
    packets += checksum;
  }

  const dataBuf = Buffer.from(packets, 'hex');
  let copiedData = dataBuf;
  let XORLength = dataBuf.length;
  let oriDataLength = XORLength;

  if (packets.length > 0) {
    // copiedData = Buffer.from(copiedData, 'hex');
    const length = copiedData.length / packetLength;
    const remains = copiedData.length % packetLength;
    dataLength += length;
    if (remains > 0) {
      dataLength += 1;
    }

    oriDataLength -= 1;
  }

  const oriDataBuf = Buffer.allocUnsafe(4);
  oriDataBuf.fill(0);
  oriDataBuf.writeInt16BE(oriDataLength, 0);
  const hexOriDataLength = oriDataBuf.slice(0, 2).toString('hex').padStart(4, '0');

  const XORData = Buffer.allocUnsafe(4);
  XORData.fill(0);
  XORData.writeInt16BE(XORLength, 0);
  const hexXORLength = XORData.slice(0, 2).toString('hex').padStart(4, '0');
  const hexBataLength = Buffer.from([dataLength]).toString('hex');

  const command = pid + cmdLen + cla + ins + p1 + p2 + hexOriDataLength + hexXORLength + hexBataLength;
  return { command, data: packets };
};


export const SDKUnknownWithCode = (command: string, code: string) => new Errors.SDKError('Unknown', `${command} - ${code}`);

/**
 * Map SE Error code to SDK Error.
 * @param {string} command
 * @param {string} errorCode
 * @return {Errors.SDKError}
 */
export const throwSDKError = (command: string, errorCode: string) => {
  const code = errorCode.toLowerCase();
  // General Errors
  switch (code) {
    case '6d00':
      throw new Errors.UnknownCommand();

    default:
  }

  // Command-specified errors
  switch (command) {
    case 'SAY_HI': {
      switch (code) {
        case '6a82':
          throw new Errors.NotRegistered();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'GET_PAIR_PWD': {
      switch (code) {
        case '6a82':
          throw new Errors.NotRegistered();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'REGISTER': {
      switch (code) {
        case '6985':
          throw new Errors.CardLocked();
        case '6a84':
          throw new Errors.MaxAppRegistered();
        case '6982':
          throw new Errors.WrongPassword();
        case '6100':
          throw new Errors.MaxPasswordTried();
        case '6a80':
          throw new Errors.AlreadyRegistered();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'CREATE_WALLET': {
      switch (code) {
        case '6881':
          throw new Errors.WalletExists();
        case '6a80':
          throw new Errors.InvalidSeedLength();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'FINISH_BACKUP': {
      switch (code) {
        case '6984':
          throw new Errors.IncorrectSum();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'SET_SEED': {
      switch (code) {
        case '6881':
          throw new Errors.WalletExists();
        case '6a82':
          throw new Errors.NotRegistered();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'AUTH_EXT_KEY': {
      switch (code) {
        case '6881':
          throw new Errors.NoWallet();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'GET_EXT_KEY': {
      switch (code) {
        case '6a86':
          throw new Errors.CoinNotSupported();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'SET_CHANGE_KEYID': {
      switch (code) {
        case '6881':
          throw new Errors.CoinNotInitialized();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'TX_PREPARE': {
      switch (code) {
        case '6984':
          throw new Errors.InvalidData();
        case '6985':
          throw new Errors.CoinNotInitialized();
        case '6001':
          throw new Errors.HashOutputMissmatch();
        case '6002':
          throw new Errors.DataTooLong();
        case '6003':
          throw new Errors.InvalidChangeRedeemScript();
        case '6004':
          throw new Errors.ChangeAddressMismatch();
        case '6005':
          throw new Errors.InvalidOmniData();
        case '6006':
          throw new Errors.InvalidChainId();
        case '6007':
          throw new Errors.TokenAddressMismatch();
        case '6008':
          throw new Errors.ReadTypeDataMismatch();
        case '6009':
          throw new Errors.InvalidSideField();
        case '60f0':
          throw new Errors.InvalidRLPFormat();
        case '60f1':
          throw new Errors.InvalidJsonFormat();
        case '6701':
          throw new Errors.DataLengthP2Mismatch();
        default:
          throw SDKUnknownWithCode(command, code);
      }
    }
    case 'SC_SEND_SEGMENT': {
      switch (code) {
        case '6296':
          throw new Error('SecureChannel: this command is not accepted through SC.');
        case '6297':
          throw new Error('SecureChannel: Missing command signature');
        case '6298': {
          throw new Error('SecureChannel: Data not encrypted');
        }
        case '609d': {
          throw new Errors.NotRegistered();
        }
        default: {
          /**
           * Receive an error not categorized as Secure Channel Error:
           * return the data and status, let parent call decide.
           */
          return;
        }
      }
    }
    default:
      throw SDKUnknownWithCode(command, code);
  }
};
