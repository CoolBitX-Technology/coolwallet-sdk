import type { GetAddress } from './response';

class Cosmos {
  url: string;

  constructor(_url: string) {
    this.url = _url;
  }

  getSequence(address: string): Promise<GetAddress> {
    return fetch(this.url + `cosmos/auth/v1beta1/accounts/${address}`).then((res) =>
      res.json().then(({ account }) => ({ sequence: account.sequence, account_number: account.account_number }))
    );
  }

  getGas(signedTxBytes: string): Promise<string> {
    const body = {
      tx_bytes: signedTxBytes,
    };
    return fetch(this.url + `cosmos/tx/v1beta1/simulate`, {
      body: JSON.stringify(body),
      method: "POST",
      headers: new Headers({ 'Content-type': 'application/json' }),
    }).then(async (res) => {
      const result = await res.json();
      return JSON.stringify(result.gas_info.gas_used);
    });
  }

  broadcastGRPC(signedTxBytes: string): Promise<string> {
    const body = {
      tx_bytes: signedTxBytes,
      mode: 'BROADCAST_MODE_BLOCK',
    };
    return fetch(this.url + `cosmos/tx/v1beta1/txs`, {
      body: JSON.stringify(body),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    }).then(async (res) => {
      const result = await res.json();
      console.log(result);
      return JSON.stringify(result.tx_response.txhash);
    });
  }
}

export default new Cosmos('https://lcd.terra.dev/');
export const Mainnet = new Cosmos('https://lcd.terra.dev/');
export const Testnet = new Cosmos('https://bombay-lcd.terra.dev/');
