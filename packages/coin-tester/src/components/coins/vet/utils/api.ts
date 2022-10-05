/* eslint-disable @typescript-eslint/no-explicit-any */
import Connex from '@vechain/connex';
import BigNumber from 'bignumber.js';

const connex = new Connex({
  node: 'https://testnet.veblocks.net',
  network: 'test',
});

export {
  getBalance,
  getBlockRef,
  getGasPrice,
  getGasLimit,
  sendTx,
};

async function getBalance(address: string): Promise<string> {
  const account = await connex.thor.account(address).get();
  // console.log('account  :', account);
  const balance = new BigNumber(account.balance).shiftedBy(-18);
  const energy = new BigNumber(account.energy).shiftedBy(-18);
  return `${balance} VET, ${energy} VTHO`;
}

function getBlockRef(): string {
  const blockRef = connex.thor.status.head.id.slice(0, 18);
  return blockRef;
}

async function getGasPrice(): Promise<number> {
  return 0;
}

async function getGasLimit(): Promise<number> {
  return 0;
}

async function sendTx(signedTx: string) {
  const url = 'https://testnet.veblocks.net/transactions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: signedTx,
    }),
  });
  const result = await response.text();
  return result;
}
