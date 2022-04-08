# CoolWallet Theta / TFuel SDK

Typescript library with support for the integration of Theta / TFuel for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/theta
```

## Usage

```typescript
import Theta, { Options, SendTransaction } from '@coolwallet/theta';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const appId = 'appId that had been registered by wallet';
const transport = await createTransport();
const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

// Initialize
const coin = new Theta();

// Get Address
const addressIndex = 0;
const address = await coin.getAddress(transport, appPrivateKey, appId, addressIndex);

// Sign Transaction
const options: Options = { transport, appPrivateKey, appId };
const transaction: SendTransaction = {
  theta: 1.2,
  tfuel: 0,
  sequence: 0,
  fromAddr: '0x3b1b121cAd57bFf936a94451B423865F0D2255D6',
  toAddr: '0x7176CeFDE9601133e942ae01d2F031F5FCDAd1F3'
};
const signedTx = await coin.signTransaction(transaction, options);
```

## Methods

### getAddress

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/500'/0'/0/{i}
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

For transferring Theta and TFuel tokens.

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
  sequence: Integer;
  addressIndex: number;
}

interface SendTransaction extends BaseTransaction {
  theta: Integer;
  tfuel: Integer;
  toAddr: string;
}

async signTransaction(
  transaction: SendTransaction,
  options: Options
): Promise<string>
```

### signStakeValidator

For staking to Validator nodes.

```typescript
interface StakeValidatorTransaction extends BaseTransaction {
  theta: Integer;
  toAddr: string;
}

async signStakeValidatorTransaction(
  transaction: StakeValidatorTransaction,
  options: Options
): Promise<string>
```
### signStakeGuardian

For staking to Guardian nodes.

```typescript
interface StakeGuardianTransaction extends BaseTransaction {
  theta: Integer;
  holderSummary: string;
}

async signStakeGuardianTransaction(
  transaction: StakeGuardianTransaction,
  options: Options
): Promise<string>
```

### signStakeEdge

For staking to Edge nodes.

```typescript
interface StakeEdgeTransaction extends BaseTransaction {
  tfuel: Integer;
  holderSummary: string;
}

async signStakeEdgeTransaction(
  transaction: StakeEdgeTransaction,
  options: Options
): Promise<string>
```

### signWithdraw

For withdrawing from staked nodes.

```typescript
enum Purpose {
  Validator = 0,
  Guardian = 1,
  Edge = 2
}

interface WithdrawTransaction extends BaseTransaction {
  purpose: Purpose;
  toAddr: string;
}

async signWithdrawTransaction(
  transaction: WithdrawTransaction,
  options: Options
): Promise<string>
```

### signSmart

For EVM transaction.

```typescript
interface SmartTransaction extends BaseTransaction {
  value: Integer;
  toAddr: string;
  gasLimit: Integer;
  data: string;
}

async signEvmTransaction(
  transaction: SmartTransaction,
  options: Options
): Promise<string>
```
