# CoolWallet TON SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/ton)](https://www.npmjs.com/package/@coolwallet/ton)

Typescript library with support for the integration of TON for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/ton
```

## Usage

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
  receiver: 'EQAW5QLk3XvW3HMbLqkE9wXkL9NdGpE1555tUxhdea8pVIbJ', // support HEX, Bounceable, Non-Bounceable
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
