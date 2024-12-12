# CoolWallet Sui SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/sui)](https://www.npmjs.com/package/@coolwallet/sui)

Typescript library with support for the integration of Sui for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm i @coolwallet/sui
```

## Usage - Get Address And Coin Transfer

```javascript
import Sui from '@coolwallet/sui';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
import Sui from '@coolwallet/sui';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
import {
  CoinTransactionArgs,
  CoinTransactionInfo,
} from '@coolwallet/sui/config/types';
import { convertToUnitAmount } from '@coolwallet/sui/utils/transactionUtil';

const sui = new Sui();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

// getAddress, path: `m/44'/784'/0'/0'/{addressIndex}'`
const address = await sui.getAddress(transport, appPrivateKey, appId, 0);

// signCoinTransaction
const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
const addressIndex = 0;
const transactionInfo: CoinTransactionInfo = {
  amount,
  toAddress,
  payment: [
    {
      objectId: '0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26',
      version: 428891992,
      digest: 'GsuLrrruMfrn6tNpPqGMvXDujTG9QcxRpF1332MCThF4',
    },
    {
      objectId: '0xa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f939387',
      version: 419878795,
      digest: '3MoCJHgS8kDb2fLLUBQaeY4Z4b4GqLN7zxkkd9hknTmL',
    },
  ],
  gasPrice: '750',
  gasBudget: '3476000',
};

const signData: CoinTransactionArgs = {
    transport,
    appPrivateKey,
    appId,
    addressIndex,
    transactionInfo,
};

const signedTx = await sui.signTransferTransaction(signData);
```

## Usage - Token Transfer

```javascript
import Sui from '@coolwallet/sui';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
import {
  TokenInfo,
  TokenTransactionArgs,
  TokenTransactionInfo,
} from '@coolwallet/sui/config/types';
import { convertToUnitAmount } from '@coolwallet/sui/utils/transactionUtil';

const addressIndex = 0;
const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
const tokenInfo: TokenInfo = {
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  suiCoinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
};

const amount = convertToUnitAmount('0.001', tokenInfo.decimals);

const transactionInfo: TokenTransactionInfo = {
  amount,
  toAddress,
  payment: [
    {
      objectId: '0x159b6593e1bcfe4f784fcffdd483de003317a401308b7ed79bb22ecfb167cd26',
      version: 428891992,
      digest: 'GsuLrrruMfrn6tNpPqGMvXDujTG9QcxRpF1332MCThF4',
    },
    {
      objectId: '0xa8d3438b75c713a9d2ad4b7bc5009ed0a0fffb909ef42a050cba2f823f939387',
      version: 419878795,
      digest: '3MoCJHgS8kDb2fLLUBQaeY4Z4b4GqLN7zxkkd9hknTmL',
    },
  ],
  gasPrice: '750',
  gasBudget: '3823624',
  coinObjects: [
    {
      objectId: '0xc7af6c6bcdebc855af9867b8048f9f12fccaf9796787fe58cff9c9214dde4bae',
      version: 428892013,
      digest: 'GUFd3NxnDsWZmDayuFYt85T1jjXjXHtC1iqFxHxt3U66',
    },
  ],
};

const signData: TokenTransactionArgs = {
  transport,
  appPrivateKey,
  appId,
  addressIndex,
  transactionInfo,
  tokenInfo,
};
const signedTx = await sui.signTokenTransferTransaction(signData);
```

## Usage - Other Transaction
```javascript
import Sui from '@coolwallet/sui';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
import { SmartTransactionArgs } from '@coolwallet/sui/config/types';
import { Transaction } from '@mysten/sui/transactions';
import BigNumber from 'bignumber.js';
import { convertToUnitAmount } from '@coolwallet/sui/utils/transactionUtil';

const addressIndex = 0;
const fromAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
const toAddress = '0x72fd5d47879c6fc39af5323b0fbda83425ca8a5172fb048aaa78c1211a98af09';
const amount = convertToUnitAmount('0.1', SUI_DECIMALS);
const gasBudget = '3476000';
const gasPrice = '750';

const transaction = new Transaction();
transaction.setSender(fromAddress);
transaction.setGasBudget(new BigNumber(gasBudget).toNumber());
transaction.setGasPayment(gasPayment);
transaction.setGasPrice(new BigNumber(gasPrice).toNumber());

const [coin] = tx.splitCoins(tx.gas, [amount]);
transaction.transferObjects([coin], toAddress);

const signData: SmartTransactionArgs = {
  transport,
  appPrivateKey,
  appId,
  addressIndex,
  transactionInfo: transaction,
};
const signedTx = sui.signTransaction(signData);
```

## Acknowledgements

This project includes code from the following open source projects:

- [mysten/sui](https://github.com/MystenLabs/sui) - Licensed under the Apache License