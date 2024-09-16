import HttpTransport from './transport';
import { CardType, Transport } from '@coolwallet/core';

const createTransport = (baseURL = 'http://localhost:9527', cardType?: CardType): Promise<Transport | undefined> =>
  new Promise((resolve, reject) => {
    const transport = new HttpTransport(baseURL, cardType);
    transport
      .request('000980CA00000000000000', '')
      .then(() => {
        resolve(transport);
      })
      .catch(reject);
  });

export { createTransport, HttpTransport };
