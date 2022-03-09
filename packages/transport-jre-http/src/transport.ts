import { Transport } from '@coolwallet/core';
import { TransportError } from '@coolwallet/core/lib/error';
import { createAxiosInstance } from './services/http';
import { decodeCommand } from './utils';
import ENDPOINTS from './configs/endpoints';
import { PID, CMD_LEN } from './configs/commands';
import type { Device } from 'react-native-ble-plx';
import type { Axios } from 'axios';

class JRETransport extends Transport {
  requestAxios: Axios;

  constructor(baseURL: string) {
    super({ name: 'JRE' } as Device);
    this.requestAxios = createAxiosInstance(baseURL);
  }

  sendCommandToCard(_: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  sendDataToCard(_: number[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  checkCardStatus(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  readDataFromCard(): Promise<number[]> {
    throw new Error('Method not implemented.');
  }

  request = async (command: string, packets: string): Promise<string> => {
    if (!command.startsWith(PID + CMD_LEN)) {
      throw new TransportError(this.request.name, 'Unknown command payload.');
    }
    const { cla, ins, p1, p2 } = decodeCommand(command);
    const requestBody = {
      cla,
      ins,
      p1,
      p2,
      // slice checksum
      data: packets.slice(0, -2),
    };
    try {
      return this.requestAxios.post<Buffer>(ENDPOINTS.SEND_APDU, requestBody).then((result) => {
        const responseString = Buffer.from(result.data).toString();
        console.debug('response data:', responseString);
        return responseString;
      });
    } catch (e) {
      const error = e as Error;
      throw new TransportError(this.request.name, error?.message);
    }
  };
}

export default JRETransport;
