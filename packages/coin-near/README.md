# CoolWallet NEAR SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/near)](https://www.npmjs.com/package/@coolwallet/near)

Typescript library with support for the integration of NEAR for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/near
```

## Near documentation

https://nomicon.io/
https://docs.near.org/docs 


## Usage

```javascript
import NEAR from '@coolwallet/near'
import * as nearAPI from 'near-api-js';

const near = new NEAR();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0; // The only one is supported

const address = await near.getAddress(transport, appPrivateKey, appId, addressIndex)

const sender = "sender_account";
const receiver = "receiver_account";
const amount = '1.5'; // in NEAR

// There are 3 type of transactions:

// Transfer
type TransferTxType = {
  sender?: string;
  publicKey?: string; 
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
}

// Stake
type StakeTxType = {
  sender?: string;
  publicKey?: string; 
  receiver?: string;
  nonce: number;
  recentBlockHash: string;
  amount: string;
  validatorPublicKey: string;
}

// Smart
type SmartTxType = {
  sender?: string;
  publicKey?: string; 
  receiver: string;
  nonce: number;
  recentBlockHash: string;
  amount?: string;
  gas?: string;
  methodName: string;
  methodArgs: Uint8Array;
}
      
let signTxData: SignTxData = {
  transport: transport!,
  appPrivateKey: appPrivateKey,
  appId: appId,
  addressIndex: addressIndex,
  transaction: txnTransfer //or txnStake or txnSmart
}

// sets up a NEAR API/RPC provider to interact with the blockchain
const provider = new nearAPI.providers.JsonRpcProvider('https://rpc.testnet.near.org');
// mainnet https://rpc.mainnet.near.org
// testnet https://rpc.testnet.near.org
// betanet https://rpc.betanet.near.org (may be unstable)
// localnet http://localhost:3030

// gets sender's public key information from NEAR blockchain 
const accessKey = await provider.query(
  `access_key/${txSender}/${publicKey.toString()}`, ''
);
const nonce = ++accessKey.nonce;
const recentBlockHash = nearAPI.utils.serialize.base_decode(accessKey.block_hash);


// Transfer
const signature = near.signTransferTransaction(signTxData)

// Staking
// const signature = near.signStakeTransaction(signTxData);
// const signature = near.signUnstakeTransaction(signTxData);

// Smart contract
// const signature = near.signSmartTransaction(signTxData);

// Smart contract based staking
// const signature = near.signSCStakeTransaction(signTxData);
// const signature = near.signSCUnstakeTransaction(signTxData);
// const signature = near.signSCUnstakeAllTransaction(signTxData);
// const signature = near.signSCWithdrawTransaction(signTxData);
// const signature = near.signSCWithdrawAllTransaction(signTxData);

## Methods

### getAddress

#### Description

CoolWallet currently support one derivation path: **SLIP0010**.

```none
m/44'/397'/0'
```

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

### signTransaction

#### Description

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```
#### signTxType Arguments

|      Arg      |                              Description                             |    Type   | Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |   TRUE   |
| appPrivateKey |               Private key for the connected application              |   string  |   TRUE   |
|     appId     |                   ID for the connected application                   |   string  |   TRUE   |
|  transaction  |          Essential information/property for NEAR Transaction         |   Object  |   TRUE   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   FALSE  |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   FALSE  |
