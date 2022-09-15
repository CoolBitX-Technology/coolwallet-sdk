import axios, { Axios } from 'axios';

type GetAccountInfoResponse = {
  sequence: string;
  account_number: string;
};

type CosmosGetAccountInfoResponse = {
  account: {
    '@type': string;
    address: string;
    pub_key: {
      '@type': string;
      key: string;
    };
    account_number: string;
    sequence: string;
  };
};

type CosmosBroadcastTxResponse = {
  tx_response: {
    txhash: string;
  };
};

class CosmosClient {
  private requestor: Axios;
  constructor(rpc_url: string) {
    this.requestor = axios.create({ baseURL: rpc_url, headers: { 'Content-Type': 'application/json' } });
  }

  async getAccountInfo(address: string): Promise<GetAccountInfoResponse> {
    const account_info_response = await this.requestor.request<CosmosGetAccountInfoResponse>({
      method: 'GET',
      url: `/cosmos/auth/v1beta1/accounts/${address}`,
      responseType: 'json',
    });
    const {
      data: {
        account: { account_number, sequence },
      },
    } = account_info_response;
    return { account_number, sequence };
  }
  

  async broadcastTransaction(rawTx: string): Promise<string> {
    const base64Tx = Buffer.from(rawTx, 'hex').toString('base64');
    const body = {
      tx_bytes: base64Tx,
      mode: 'BROADCAST_MODE_BLOCK',
    };
    const result = await this.requestor.request<CosmosBroadcastTxResponse>({
      method: 'POST',
      url: 'cosmos/tx/v1beta1/txs',
      responseType: 'json',
      data: JSON.stringify(body),
    });
    return result.data.tx_response.txhash;
  }
}

export default CosmosClient;
