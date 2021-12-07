# CoolWallet Ripple (XRP) SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/xrp)](https://www.npmjs.com/package/@coolwallet/xrp)

Typescript library with support for the integration of Bitcoin for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/xrp
```

## Usage

```javascript
import XRP from '@coolwallet/xrp'
const xrp = new XRP();

const address = await xrp.getAddress(transport, appPrivateKey, appId, 0);
// rEoA7FTruU4SMdG99yuuUbUPxp1bh9aZjR

const payment = {
  Sequence: 1566719,
  DestinationTag: 1882298635,
  LastLedgerSequence: 47914574,
  Amount: "100000", // in drops
  Fee: "1000",      // in drops
  SigningPubKey: "027f033c29de4bc02096492da93e00d55d2851f74dc0b5ab58c9b83b3e8067b4af",  // optional
  Account: "rEoA7FTruU4SMdG99yuuUbUPxp1bh9aZjR",  // optional
  Destination: "rp6ENYKqYfT5qJqQiN2Y9AnZmFEWv9hRpq"
}

const signTxData = {
    transport,
    appPrivateKey,
    appId,
    payment,
    addressIndex
}

const transaction = await xrp.signTransaction(signTxData)
```

You might already know the public key of the source account (by calling `.getPublicKey()` before ). if that's the case, put it in the Payment object as `SigningPubKey`. Otherwise we would need another bluetooth command to derive the key again.

## Methods

### getAddress

#### Description

Get address by address index.

The XRP address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/144'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/144'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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
|  addressIndex |  The from address index in BIP44 derivation  |   number  |   TRUE   |

### signPayment

#### Description

Sign Ripple Transaction.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```

#### signTxType Arguments

|      Arg      |                              Description                             |    Type   | Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |   TRUE   |
| appPrivateKey |               Private key for the connected application              |   string  |   TRUE   |
|     appId     |                   ID for the connected application                   |   string  |   TRUE   |
|    payment    |          Essential information/property for XRP Transaction          |  Payment  |   TRUE   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |   TRUE   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   FALSE  |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   FALSE  |


