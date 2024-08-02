# CoolWallet TON SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/ton)](https://www.npmjs.com/package/@coolwallet/ton)

Typescript library with support for the integration of TON for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/ton
```


## Usage - Get Address And Coin Transfer
```javascript
import TON from '@coolwallet/ton';

const ton = new TON();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

// getAddress
const address = await ton.getAddress(transport, appPrivateKey, appId, addressIndex);

// signTransaction
const transaction: TransferTxType = {
  toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ', // support HEX, Bounceable, Non-Bounceable
  amount: '123000000', // nanotons
  seqno: 100,
  sendMode: 3, // default: 3, https://docs.ton.org/develop/smart-contracts/messages#message-modes
  payload: 'Hello',
};

const signTxData: SignTransferTxType = {
  transport: transport,
  appPrivateKey: appPrivateKey,
  appId: appId,
  addressIndex: addressIndex,
  transaction: txnTransfer,
};

const signedTx = await ton.signTransaction(signTxData);
```

## Usage - Token Transfer

```javascript
const transaction: TransferTxType = {
  toAddress: 'EQBgGEdG_Uj-c1hcy2zBT6e7ADNpE2KBoXQTKAWSeeLBKHcu', // sender's token account.
  amount: '50000000', // nanotons, its a fee consumed during the transaction process.
  seqno: 19,
  sendMode: 3,
  payload: {
    jettonAmount: '1234', // USDT amount (in smallest unit).
    toAddress: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ', // receiver's coin account.
    forwardAmount: '1',
    forwardPayload: 'Hello',
    responseAddress: 'EQAlWnyf_OmGFyJ3wHkP930RGPDtokkcYhphAjId05OOI3Up', // sender's coin account.
  },
  tokenInfo: {
    symbol: 'USDT',
    decimals: 6,
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  },
};

const signTxData: SignTransferTxType = {
  transport: transport,
  appPrivateKey: appPrivateKey,
  appId: appId,
  addressIndex: addressIndex,
  transaction: txnTransfer,
};

const signedTx = await ton.signTransferTokenTransaction(signTxData);
```
