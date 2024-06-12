import 'isomorphic-fetch';

const main_config = {
  project_id: 'mainnetEMA6xeDs6p9hq2Cxfs9hCVPfRmjpSEu1',
  network: 'mainnet',
};
const test_config = {
  project_id: 'preprod5wKKMffQzylz8tdSR56Q3jdiwymVLjag',
  network: 'preprod',
};

let config = main_config;

export function setTestnetApi(isTestnet: boolean){
  if(isTestnet) {
    config = test_config;
  }
  else {
    config = main_config;
  }
}

async function getData(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { project_id: config.project_id }
  });
  const result = await response.json();
  return result;
}

export async function getAddressInfo(address: string) {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/addresses/${address}`);
}

export async function getLatestBlock() {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/blocks/latest`);
}

export async function getLatestProtocolParameters() {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/epochs/latest/parameters`);
}

export async function getUtxos(address: string) {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/addresses/${address}/utxos`);
}

export async function sendTx(tx: string) {
  const url = `https://cardano-${config.network}.blockfrost.io/api/v0/tx/submit`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { project_id: config.project_id , 'Content-Type': 'application/cbor' },
    body: Buffer.from(tx, 'hex'),
  });
  console.log('response :', response);
  const result = await response.json();
  if (response.ok) return result;
  console.log('result :', result);
  return result.message;
}

// Staking

export async function getStakePools() {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/pools?count=10`);
}

export async function getRegistrationHistory(stakeAddress: string) {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/accounts/${stakeAddress}/registrations`);
}

export async function getDelegationHistory(stakeAddress: string) {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/accounts/${stakeAddress}/delegations`);
}

export async function getAccountInfo(stakeAddress: string) {
  return getData(`https://cardano-${config.network}.blockfrost.io/api/v0/accounts/${stakeAddress}`);
}
