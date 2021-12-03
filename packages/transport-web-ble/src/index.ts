/// <reference types="web-bluetooth" />
import { Transport } from '@coolwallet/core';
import WebBleManager from './WebBleManager';

// Create a singleton WebBleManager
const webBleManager = new WebBleManager();

/**
 * A convenient way to create internal transport.
 * @returns {Transport.default}
 */
export const createTransport = (): Promise<Transport> => (
  new Promise((resolve, reject) => {
    webBleManager
      .listen()
      .then((device) => {
        webBleManager.connect(device).then(resolve).catch(reject);
      })
      .catch(reject);
  })
);

export { default as WebBleTransport } from './WebBleTransport';
export default webBleManager;
