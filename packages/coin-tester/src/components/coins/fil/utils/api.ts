import filecoinRPCClient from '@glif/filecoin-rpc-client';

// https://lotus.filecoin.io/developers/glif-nodes/
const Endpoints = {
  main: 'https://api.node.glif.io/rpc/v0',
  test: 'https://api.calibration.node.glif.io/rpc/v0',
};

const GraphEndpoints = {
  main: 'https://graph.glif.link/query',
  test: 'https://graph-calibration.glif.link/query',
};

const isTestnet = true;

const client = new filecoinRPCClient({ apiAddress: isTestnet ? Endpoints.test : Endpoints.main });

export async function getBalance(address: string) {
  return client.request('WalletBalance', address);
}

export async function getNonce(address: string) {
  return client.request('MpoolGetNonce', address);
}

export async function sendTx(signedTx: string) {
  return client.request('MpoolPush', signedTx);
}

export async function estimateMessageGas(message: {
  To: string,
  From: string,
  Nonce: number,
  Value: string,
  Method: number,
  Params: string
}) {
  return client.request('GasEstimateMessageGas', message, { MaxFee: '0' }, null);
}

export async function getMessageList(address: string) {
  const url = isTestnet ? GraphEndpoints.test : GraphEndpoints.main;

  // https://github.com/glifio/react-components/blob/primary/src/graphql/query/Messages.graphql
  const query = `query Messages($address: String!, $limit: Int!, $offset: Int!) {
    messages(address: $address, limit: $limit, offset: $offset) {
      cid
      height
      from {
        id
        robust
      }
      to {
        id
        robust
      }
      value
      method
      params
    }
  }`
  const limit = 10;
  const offset = 0;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { address, limit, offset },
    })
  });
  const body = await response.json();
  return body.data.messages;
}

