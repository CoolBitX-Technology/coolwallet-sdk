# CoolWallet APTOS SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/aptos)](https://www.npmjs.com/package/@coolwallet/aptos)

Typescript library with support for the integration of APTOS for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/aptos
```

## Usage

```typescript
import Aptos from '@coolwallet/aptos';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const appId = 'appId that had been registered by wallet';
const transport = await createTransport();
const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

// Initialize
const aptos = new Aptos();

// Get Public Key and Authentication Key
const keyIndex = 0;
const authKey = await aptos.getAuthKey(transport, appPrivateKey, appId, keyIndex);

// Sign Transaction
const options: Options = { transport, appPrivateKey, appId };
const transaction = {
  keyIndex,
  sender,
  receiver,
  sequence,
  amount,
  gasLimit,
  gasPrice,
  expiration,
};
const signedTx = await aptos.signTransaction(transaction, options);
```

## Methods

### getAuthKey

#### Description

Derivation Path: BIP39 > SLIP0010 > EDDSA.

```none
m/44'/637'/0'/0'/${keyIndex}'
````

```javascript
async getAuthKey(
    transport: Transport,
    appPrivateKey: string,
    appId: string
    keyIndex: number
): Promise<string>
```

### signTransaction

#### Description

```javascript
interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

interface Transaction {
  keyIndex: number;
  sender: string;
  sequence: Integer;
  receiver: string;
  amount: Integer;
  gasLimit: Integer;
  gasPrice: Integer;
  expiration: Integer;
}

// return fake signed tx for estimating gas fee
getFakeSignedTx = async (transaction: Transaction, options: Options): Promise<string> => {

// return tx hash
signTransaction = async (transaction: Transaction, options: Options): Promise<string> => {

```
