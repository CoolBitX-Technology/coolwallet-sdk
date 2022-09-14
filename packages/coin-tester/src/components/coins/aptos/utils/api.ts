/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from '@coolwallet/aptos';
import { AptosClient, FaucetClient } from 'aptos';
import BigNumber from 'bignumber.js';

export {
  fundAccount,
  accountBalance,
  lookupAddressByAuthKey,
  getSequenceAndAuthKey,
  getChainId,
  getGasPrice,
  getGasLimit,
  getHistory,
  sendTx,
};

const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/*
    const gasPrice = await getGasPrice();

    const testGasLimit = 2000;
    const tx = {
      sender,
      receiver,
      sequence,
      amount: 1000,
      gasLimit: testGasLimit,
      gasPrice,
      expiration: Math.floor(Date.now() / 1000) + 10,
    };
    const usedGas = await getGasLimit(tx, publicKey);

    const history = await getHistory(oriAuth);
*/
async function fundAccount(address: string, amount: number) {
  return faucetClient.fundAccount(address, amount);
}

async function accountBalance(address: string) {
  try {
    const resource = await client.getAccountResource(address, '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
    const { coin } = resource.data as any;
    return coin.value;
  } catch (error) {
    return 'Not Exist';
  }
}

async function lookupAddressByAuthKey(authKey: string) {
  try {
    const resource = await client.getAccountResource('0x1', '0x1::account::OriginatingAddress');
    const { address_map } = resource.data as any;
    const origAddress = await client.getTableItem(address_map.handle, {
      key_type: 'address',
      value_type: 'address',
      key: authKey,
    });
    return origAddress;
  } catch (error) {
    return '';
  }
}

async function getSequenceAndAuthKey(address: string) {
  try {
    const {
      sequence_number: sequence,
      authentication_key: currentAuth,
    } = await client.getAccount(address);
    return { sequence, currentAuth };
  } catch (error) {
    return { sequence: '', currentAuth: '' };
  }
}

async function getChainId() {
  return client.getChainId();
}

async function getGasPrice() {
  const { gas_estimate } = await client.client.transactions.estimateGasPrice();
  return gas_estimate;
}

// estimate gas

function remove0x(param: string) {
  if (!param) return '';
  const s = param.toLowerCase();
  return s.startsWith('0x') ? s.slice(2) : s;
}

function checkHex(param: string, length: number) {
  const hex = remove0x(param);
  const re = /^([0-9A-Fa-f]{2})+$/;
  const isHex = re.test(hex);
  const validLength = hex.length === length;
  if (!isHex) throw new Error('invalid hex format');
  if (!validLength) throw new Error(`invalid length, need ${length}, get ${hex.length}`);
  return hex;
}

function toU64Arg(param: string | number) {
  const bn = new BigNumber(param);
  const hex = bn.toString(16);
  const len = Math.ceil(hex.length/2)*2;
  return Buffer.from(hex.padStart(len, '0'),'hex').reverse().toString('hex').padEnd(16,'0');
}

function getSignedTx(tx: Transaction, publicKey: string, sig?: string) {
  const { sender, sequence, receiver, amount, gasLimit, gasPrice, expiration } = tx;

  let signedTx = '';
  signedTx += checkHex(sender, 64);
  signedTx += toU64Arg(sequence);
  signedTx += '02';
  signedTx += '0000000000000000000000000000000000000000000000000000000000000001';
  signedTx += '0d6170746f735f6163636f756e74';
  signedTx += '087472616e73666572';
  signedTx += '000220';
  signedTx += checkHex(receiver, 64);
  signedTx += '08';
  signedTx += toU64Arg(amount);
  signedTx += toU64Arg(gasLimit);
  signedTx += toU64Arg(gasPrice);
  signedTx += toU64Arg(expiration);
  signedTx += '1b'; // chainId
  signedTx += '0020';
  signedTx += checkHex(publicKey, 64);
  signedTx += '40';
  signedTx += sig ? checkHex(sig, 128) : '0'.repeat(128);
  return signedTx;
}

async function getGasLimit(tx: Transaction, publicKey: string) {
  try {
    const fakeSignedTx = getSignedTx(tx, publicKey);
    const res = await client.submitBCSSimulation(Buffer.from(fakeSignedTx,'hex'));
    const result = res[0];
    if (!result.success) throw new Error(result.vm_status);
    return result.gas_used;
  } catch (error) {
    return error;
  }
}

async function getHistory(address: string) {
  const transactions = await client.client.transactions.getAccountTransactions(address);
  return transactions;
}

async function sendTx(bcsTxn: Buffer) {
  const pendingTxn = await client.submitSignedBCSTransaction(bcsTxn);
  await client.waitForTransaction(pendingTxn.hash);
}
