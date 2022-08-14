# CoolWallet Filecoin SDK

This is a typescript library with support for the integration of Filecoin for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm install @coolwallet/fil
```

## Usage

```typescript
import Fil, { Options } from '@coolwallet/fil';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const appId = 'appId that had been registered by wallet';
const transport = await createTransport();
const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

// Initialize
const fil = new Fil();

// Get Address
const addressIndex = 0;
const address = await fil.getAddress(transport, appPrivateKey, appId, addressIndex);

// Sign Transaction
const options = { transport, appPrivateKey, appId };
const transaction = {
  addressIndex: 0,
  to: 'f14ehgithi6wri4gordkgq4623kyom5tnzbxt5dsy',
  nonce: 0,
  value: '123.456',
  gasLimit: 609960,
  gasFeeCap: '101164',
  gasPremium: '100110',
  // method: 2, (option for smart contract)
  // params: 'gtgqWBkAAVUAFGZpbC83L3BheW1lbnRjaGFubmVsWEqCVQElRUfDOAbbTJ6ACbjr2cTS5fIBglgxA5MHnM9FDHIFsKjsZKFuYvWfYSdZCbFOkaaE1KzG8yG07EH0VDMTwgWuYAGf7JwwTg==', (option for smart contract)
};
console.log('transaction :', transaction);
const signedTx = await fil.signTransaction(transaction, options);
```

## Methods

### getAddress

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/461'/0'/0/{i}
```

```javascript
async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
): Promise<string>
```

### signTransaction

For transferring FIL tokens.

```typescript
type Integer = string | number;

interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

interface InputTransaction {
  addressIndex: number,
  to: string,
  nonce: Integer,
  value: Integer,
  gasLimit: Integer,
  gasFeeCap: Integer,
  gasPremium: Integer,
  method?: number,
  params?: string
}

interface RawTransaction {
  To: string,
  From: string,
  Nonce: number,
  Value: string, 
  GasLimit: number,
  GasFeeCap: string,
  GasPremium: string,
  Method: number,
  Params: string,
}

interface SignedTransaction {
  Message: RawTransaction,
  Signature: {
    Data: string,
    Type: number
  }
}

async signTransaction(
  transaction: InputTransaction,
  options: Options
): Promise<SignedTransaction>
```
