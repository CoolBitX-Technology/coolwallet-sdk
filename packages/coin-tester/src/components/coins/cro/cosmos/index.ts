import { tx } from '@coolwallet/core/lib/apdu';
import type { GetAddress } from './response';

class Cosmos {
  url: string;
  gRpcUrl: string;

  constructor() {
    this.url = 'https://mainnet.crypto.org:26657/';
    this.gRpcUrl = 'https://mainnet.crypto.org:1317/';
  }

  getSequence(address: string): Promise<GetAddress> {
    return fetch(this.gRpcUrl + `cosmos/auth/v1beta1/accounts/${address}`).then((res) =>
      res.json().then(({ account }) => ({ sequence: account.sequence, account_number: account.account_number }))
    );
  }

  broadcast(signedTxBytes: string): Promise<string> {
    const hexString = Buffer.from(signedTxBytes, 'base64').toString('hex');
    return fetch(this.url + `broadcast_tx_sync?tx=0x${hexString}`).then(async (res) => {
      const result = await res.json();
      return JSON.stringify(result.result.hash);
    });
  }
}

export default new Cosmos();
