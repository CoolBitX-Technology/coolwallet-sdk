# CoolWallet NEAR SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/near)](https://www.npmjs.com/package/@coolwallet/near)

Typescript library with support for the integration of NEAR for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/near
```

## Usage

```javascript
import NEAR from '@coolwallet/near'
import { TransactionBuilder } from 'near-sdk';
const near = new NEAR();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await near.getAddress(transport, appPrivateKey, appId, addressIndex)
// GBKC7MNVXPYN75B6XB5BRBPXYXBDLKVEGJERPNQJPFOAGS2OFQICZBGG


const sender = "sender_account";
const receiver = "receiver_account";
const amount = '1.5'; // in NEAR

const transaction = {
	sender, 
    receiver, 
    amount,
	nonce,
	publicKey
}

const signTxData = {
    transport,
    appPrivateKey,
    appId,
    transaction,
    addressIndex
}

// sets up a NEAR API/RPC provider to interact with the blockchain
const provider = new nearAPI.providers
  .JsonRpcProvider(`https://rpc.near.org`);

// gets sender's public key information from NEAR blockchain 
const accessKey = await provider.query(
  `access_key/${txSender}/${publicKey.toString()}`, ''
);

const signature = await near.signTransaction(signTxData)


## Methods

### getAddress

#### Description

CoolWallet currently support 2 derivation path, the default one is **SLIP0010**.

```none
m/44'/94'/0'
```

We call the fourth parameter **protocol**, which can only be either `'BIP44'` or `'SLIP0010'`. You will need to specify the protocol parameter when you're signing a transaction.

```javascript
async getAddress(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string
): Promise<string> 
```

#### Arguments
|      Arg      |                  Description                 |    Type   | Required |
|:-------------:|:--------------------------------------------:|:---------:|:--------:|
|   transport   | Object to communicate with CoolWallet device | Transport |   TRUE   |
| appPrivateKey |   Private key for the connected application  |   string  |   TRUE   |
|     appId     |       ID for the connected application       |   string  |   TRUE   |
|    protocol   |      Define the protocol you're signing      |  PROTOCOL |   FALSE  |

### signTransaction

#### Description

We expect you to build transactions with the [official stellar sdk](https://github.com/stellar/js-stellar-sdk). You can easily use the `.signatureBase()` method to get the buffer that CoolWallet needs for signing.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```
#### signTxType Arguments

|      Arg      |                              Description                             |    Type   | Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |   TRUE   |
| appPrivateKey |               Private key for the connected application              |   string  |   TRUE   |
|     appId     |                   ID for the connected application                   |   string  |   TRUE   |
|  transaction  |          Essential information/property for NEAR Transaction          |   Object  |   TRUE   |
|    protocol   |                  Define the protocol you're signing                  |  PROTOCOL |   FALSE  |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   FALSE  |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   FALSE  |
