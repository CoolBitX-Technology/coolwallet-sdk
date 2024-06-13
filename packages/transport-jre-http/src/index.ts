import HttpTransport from './transport';
import type { Transport } from '@coolwallet/core';
import type { Device } from 'react-native-ble-plx';

const createTransport = (baseURL = 'http://localhost:9527'): Promise<Transport | undefined> =>
  new Promise((resolve, reject) => {
    const transport = new HttpTransport(baseURL);
    transport
      .request('000980CA00000000000000', '')
      .then((response) => {
        const cardId = response.slice(0, response.length - 4);
        const deviceName = Buffer.from(cardId, 'hex').toString();
        transport.device = { name: `CoolWallet ${deviceName}` } as Device;
        resolve(transport);
      })
      .catch(reject);
  });

export { createTransport, HttpTransport };

