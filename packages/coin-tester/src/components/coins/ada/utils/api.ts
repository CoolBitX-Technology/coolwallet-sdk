import 'isomorphic-fetch';

const project_id = 'mainnetEMA6xeDs6p9hq2Cxfs9hCVPfRmjpSEu1';

async function getData(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { project_id }
  });
  const result = await response.json();
  return result;
}

export async function getAddressInfo(address: string) {
  return getData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}`);
}

export async function getLatestBlock() {
  return getData('https://cardano-mainnet.blockfrost.io/api/v0/blocks/latest');
}

export async function getLatestProtocolParameters() {
  return getData('https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest/parameters');
}

export async function getUtxos(address: string) {
  return getData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/utxos`);
}

export async function sendTx(tx: string) {
  const url = 'https://cardano-mainnet.blockfrost.io/api/v0/tx/submit';
  const response = await fetch(url, {
    method: 'POST',
    headers: { project_id, 'Content-Type': 'application/cbor' },
    body: Buffer.from(tx, 'hex'),
  });
  console.log('response :', response);
  const result = await response.json();
  if (response.ok) return result;
  console.log('result :', result);
  return result.message;
}
