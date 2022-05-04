# CoolWallet Terra SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/terra)](https://www.npmjs.com/package/@coolwallet/terra)

Typescript library with support for the integration of Terra for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/terra
```

## Usage

```javascript
import Terra, { CHAIN_ID, DENOMTYPE, SignDataType } from '@coolwallet/terra';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const coinTerra = new Terra();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await coinTerra.getAddress(transport, appPrivateKey, appId, addressIndex);

// Normal transfer with signTransferTransaction
const transaction = {
  chainId: CHAIN_ID.MAIN,
  accountNumber: 1, // account_number from rpc
  sequence: 1, // sequence from rpc
  fromAddress: address,
  toAddress: 'toAddress'
  coin: {
    denom: DENOMTYPE.LUNA,
    amount: 1000 // transaction amount
  },
  fee: {
    gas_limit: 100000,
    denom: DENOMTYPE.LUNA,
    amount: 5000,
  },
  memo: 'test signature',
};

const signTxData: SignDataType = {
  appPrivateKey: props.appPrivateKey,
  appId: props.appId,
  addressIndex: 0,
  transaction,
  transport,
};

const signedTx = await coinTerra.signTransferTransaction(signTxData);

// Normal transfer with signTransaction

const transaction = {
  chainId: CHAIN_ID.MAIN,
  accountNumber: 1, // account_number from rpc
  sequence: 1, // sequence from rpc
  msgs: [
    {
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      amount: [{ 
        amount: 1000, // transaction amount, 
        denom: 'uluna'
      }],
      from_address: address,
      to_address: 'toAddress',
    },
  ],
  fee: {
    amount: [{ amount: '5000000', denom: 'uluna' }],
    gas_limit: '100000',
    granter: '',
    payer: '',
  },
  memo: 'test signature',
};
const signTxData = {
  appPrivateKey: props.appPrivateKey,
  appId: props.appId,
  addressIndex: 0,
  transaction,
  transport,
};

// This signedTx should be same as signedTx above.
const signedTx = await coinTerra.signTransaction(signTxData);
```

For more example, please refer to [tests/index.spec.ts](./tests/index.spec.ts).


## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/330'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/330'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
): Promise<string>
```

### signTransaction

#### Description

Sign transaction with multiple msgs, useful when user cannot specify which signing function should be called.

```javascript
async signTransaction(signData: types.SignMsgBlindType): Promise<string>
```

### signTransferTransaction

#### Description

Sign single transfer transaction with CoolWallet Pro.

```javascript
async signTransferTransaction(signData: types.SignMsgSendType): Promise<string>;
```

### signDelegateTransaction

#### Description

Sign single delegate transaction with CoolWallet Pro.

```javascript
async signDelegateTransaction(signData: types.SignMsgSendType): Promise<string>;
```

### signUndelegateTransaction

#### Description

Sign single undelegate transaction with CoolWallet Pro.

```javascript
async signUndelegateTransaction(signData: types.SignMsgSendType): Promise<string>;
```

### signWithdrawTransaction

#### Description

Sign single withdraw transaction with CoolWallet Pro.

```javascript
async signWithdrawTransaction(signData: types.SignMsgSendType): Promise<string>;
```

### signMsgExecuteContractTransaction

#### Description

Sign single MsgExecuteContract transaction with CoolWallet Pro.

```javascript
async signMsgExecuteContractTransaction(signData: types.SignMsgSendType): Promise<string>;
```

### signMsgCW20Transaction

#### Description

Sign single MsgExecuteContract transaction with CoolWallet Pro.

```javascript
async signMsgCW20Transaction(signData: types.SignMsgSendType): Promise<string>;
```