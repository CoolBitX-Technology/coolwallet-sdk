import NfcTransport from './transport';
import type { Transport } from '@coolwallet/core';
import type { Device } from 'react-native-ble-plx';

const createTransport = (): Promise<Transport | undefined> =>
  new Promise((resolve, reject) => {
    const transport = new NfcTransport();
    transport
      .request('000980CA00000000000000', '')
      .then(() => {
        resolve(transport);
      })
      .catch(reject);
  });

export { createTransport, NfcTransport };