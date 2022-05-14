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

```

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/12586''/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/12586'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
): Promise<string>
```

#### Arguments

|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
|   transport   | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey |   Private key for the connected application  |   string  |    True   |
|     appId     |       ID for the connected application       |   string  |    True   |
|     payment   |       MINA payment Arguments                 |   any     |    True   |
|  addressIndex |  The from address index in BIP44 derivation  |   number  |    True   |


#### Sign Transaction
#### Sign Payment Arguments

|         Arg        |                                 Description                                |  Type  | Required |
|:------------------:|:--------------------------------------------------------------------------:|:------:|:--------:|
|     senderAddress  |                     The from address of the transaction                    | string |   True   |
|    receiverAddress |                     The to address of the transaction                      | string |   True   |
|        amount      |                     The amount of the transaction                          | string |   True   |
|         fee        |                     The fee of the transaction                             | string |   True   |
|        nonce       |                     The nonce of the transaction                           | string |   True   |
|       validUntil   |                     The nonce of the transaction                           | number | optional default - 4294967295)  |
|         memo       |                     The note for this transaction                          | string | optional default - ""           |

```javascript
import Mina from '@coolwallet/mina'
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';
const mina = new Mina();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const addressIndex = 0;

// === networkId ===
// MAINNET = 0x01,
// DEVNET = 0x00,

const payment = {
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
