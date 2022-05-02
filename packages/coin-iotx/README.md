# CoolWallet IoTex SDK

This is a typescript library with support for the integration of IoTex for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/iotx
```

## Usage

```typescript
import Iotx, { Options } from '@coolwallet/iotx';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const appId = 'appId that had been registered by wallet';
const transport = await createTransport();
const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

// Initialize
const iotx = new Iotx();

// Get Address
const addressIndex = 0;
const address = await iotx.getAddress(transport, appPrivateKey, appId, addressIndex);

// Sign Transaction
const options: Options = { transport, appPrivateKey, appId };
const transaction = {
  addressIndex,
  nonce: 1,
  gasLimit: 10000,
  gasPrice: '1000000000000',
  amount: '10000000000000000',
  recipient: 'io13nq26mfmse47uk8rgakld34yqrghgnl5hklnnc',
};
const signedTx = await iotx.signTransaction(transaction, options);
```

## Methods

### getAddress

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/304'/0'/0/{i}
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

For transferring IOTX tokens.

```typescript
type Integer = string | number;

interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

interface BaseTransaction {
  addressIndex: number;
  nonce: Integer;
  gasLimit: Integer;
  gasPrice: Integer;
}

interface Transfer extends BaseTransaction {
  amount: Integer;
  recipient: string;
  payload?: string;
}

async signTransaction(
  transaction: Transfer,
  options: Options
): Promise<string> {
```

### signExecution

For EVM transaction.

```typescript
interface Execution extends BaseTransaction {
  amount: Integer;
  contract: string;
  data?: string;
}

async signExecution(
  transaction: Execution,
  options: Options
): Promise<string> {
```

### signStakeCreate

For creating bucket for voting.

```typescript
interface StakeCreate extends BaseTransaction {
  candidateName: string;
  amount: Integer;
  duration: Integer;
  isAuto: boolean;
}

async signStakeCreate(
  transaction: StakeCreate,
  options: Options
): Promise<string> {
```
### signStakeUnstake

For releasing a over-time bucket.

```typescript
interface StakeUnstake extends BaseTransaction {
  bucketIndex: Integer;
}

async signStakeUnstake(
  transaction: StakeUnstake,
  options: Options
): Promise<string> {
```

### signStakeWithdraw

For withdraw IOTX from a released bucket

```typescript
interface StakeWithdraw extends BaseTransaction {
  bucketIndex: Integer;
}

async signStakeWithdraw(
  transaction: StakeWithdraw,
  options: Options
): Promise<string> {
```

