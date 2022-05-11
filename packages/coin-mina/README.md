# CoolWallet MINA SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/mina)](https://www.npmjs.com/package/@coolwallet/mina)

Typescript library with support for the integration of MINA for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/mina
```

## Usage

```javascript
import Mina from '@coolwallet/mina'
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
const mina = new Mina();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const addressIndex = 0;

const address = await mina.getAddress(transport, appPrivateKey, appId, addressIndex);

// === networkId ===
// MAINNET = 0x01,
// DEVNET = 0x00,

// === txType ===
// PAYMENT = 0x00,
// DELEGATION = 0x04,

const payment = {
  txType: 0x00,
  senderAccount: 0,
  senderAddress: "B62qkHckdzjv1Ger9o3HNDUgKkBS6yW2t6pA1k2f2vP9FLkyzGvN5cz",
  receiverAddress: "B62qo3zmbBZhja7iLdKwYGtQH7CHjVgiSDt5nngrSpKnti43doLVaaa",
  amount: 1000000,
  fee: 1000000000,
  nonce: 1,
  memo: "SDK payment",
  networkId: 0x00,
}

const signTxData = {
    transport,
    appPrivateKey,
    appId,
    payment,
    addressIndex
}

const transaction = await mina.signTransaction(signTxData)
```

#### Arguments

|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
|   transport   | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey |   Private key for the connected application  |   string  |    True   |
|     appId     |       ID for the connected application       |   string  |    True   |
|     payment   |                                              |   any     |    True   |
|  addressIndex |  The from address index in BIP44 derivation  |   number  |    True   |