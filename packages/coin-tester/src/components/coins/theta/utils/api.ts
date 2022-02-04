function objectToQueryString(object: any) {
  if(!object) return "";
  let queryString = Object.keys(object).map(function(key) {
    let val = object[key];
    if(val) return encodeURIComponent(key) + '=' + encodeURIComponent(object[key]);
  }).join('&');

  if(queryString.length > 0) return "?" + queryString;
  return "";
}

async function get(url: string, queryObj?: any) {
  const options = { method: 'GET' };
  const urlQuery = url + objectToQueryString(queryObj);
  return fetch(urlQuery, options);
}

async function post(url: string, method: string, params: any, additionalHeaders?: any) {
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const headers = Object.assign(defaultHeaders, additionalHeaders);
  const options = { method: 'POST', headers, body: '' };
  const dataObj = { jsonrpc: "2.0", method, params, id: 1 };
  options.body = JSON.stringify(dataObj);
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  const { result, error } = await response.json();
  if (error) throw new Error(error.message);
  return result;
}

// https://github.com/thetatoken/theta-wallet-web/blob/master/src/services/Api.js#L178
export async function fetchGuardianNodeDelegates() {
  const url = `https://api.thetatoken.org/v1/guardian/delegated-nodes`;
  const response = await get(url);
  return response.json();
}

const rpcUrl = 'https://theta-bridge-rpc.thetatoken.org/rpc';

// https://docs.thetatoken.org/docs/rpc-api-reference#getaccount
export async function getAccount(address: string) {
  return post(rpcUrl, "theta.GetAccount", [{address}]);
}

// https://docs.thetatoken.org/docs/rpc-api-reference#callsmartcontract
export async function callSmartContract(sctx_bytes: string) {
  return post(rpcUrl, "theta.CallSmartContract", [{sctx_bytes}]);
}

// https://docs.thetatoken.org/docs/rpc-api-reference#broadcastrawtransactionasync
export async function broadcastTx(tx_bytes: string) {
  return post(rpcUrl, "theta.BroadcastRawTransactionAsync", [{tx_bytes}]);
}

export async function sendEvmTx(tx_bytes: string) {
  const url = 'https://eth-rpc-api.thetatoken.org/rpc';
  return post(url, "eth_sendRawTransaction", [tx_bytes]);
}
