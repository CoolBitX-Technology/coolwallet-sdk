# CoolWallet Stellar (XLM) SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/xlm)](https://www.npmjs.com/package/@coolwallet/xlm)

Typescript library with support for the integration of Stella for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/xlm
```

## Usage

```javascript
import XLM from '@coolwallet/xlm'
import { TransactionBuilder } from 'stellar-sdk';
const xlm = new XLM(COIN_SPECIES); //COIN_SPECIES.XLM, COIN_SPECIES.KAU COIN_SPECIES.KAG

const address = await xlm.getAddress(transport, appPrivateKey, appId)
// GBKC7MNVXPYN75B6XB5BRBPXYXBDLKVEGJERPNQJPFOAGS2OFQICZBGG

const addressBip44 = await xlm.getAddress(transport, appPrivateKey, appId, 'BIP44');
// GBE6DJHSIR6RLPCTJLIYBCA7VUOFNJ5YW6MSAOJL3QQ4E2BI3OA5EFP4


const param = new TransactionBuilder(fundingAccount, {
	fee: parseInt(moveDecimal(fee, 7), 10),
	networkPassphrase: data.networkPassphrase,
})
	.addOperation(operation)
	.setTimeout(TimeoutInfinite)
	.addMemo(memo);

const tx = param.build();

const txData = {
	from: publicKey,
	to: publicKey,
	amount: value * 10000000,
	fee: tx.fee,
	sequence: tx.sequence,
	minTime: tx.timeBounds.minTime,
	maxTime: tx.timeBounds.maxTime,
	memoType: memoType,
	memo: "",
	isCreate: true
}

const signTxData = {
    transport,
    appPrivateKey,
    appId,
    transaction,
    protocol
}

const signatureTx = await xlm.signTransaction(signTxData)
```
In construct, you can choose the chain you want to implement.



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
    appId: string, 
    addressIndex: number
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
|  transaction  |          Essential information/property for XLM Transaction          |   Object  |   TRUE   |
|    protocol   |                  Define the protocol you're signing                  |  PROTOCOL |   FALSE  |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   FALSE  |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   FALSE  |
