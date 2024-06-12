# CoolWallet Icon (VET) SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/vet)](https://www.npmjs.com/package/@coolwallet/vet)

Typescript library with support for the integration of VeChain for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/vet
```

## Usage

```javascript
import VET from '@coolwallet/vet'
import IconService from "icon-sdk-js";
const VeChain = new VET()

const address = await VeChain.getAddress(transport, appPrivateKey, appId, 0);

const timestamp = "0x" + (new Date().getTime() * 1000).toString(16);

const { IconBuilder, IconAmount, IconConverter } = IconService;

const param = new IconBuilder.IcxTransactionBuilder()
    .from('hx76f46307b53686f2dd4a2c8ca2f22492e842c4bf')
    .to('hxe86b015c06145965931aff551d4958256a86226e')
    .value(IconAmount.of('0.023', IconAmount.Unit.VET).toLoop())
    .stepLimit(IconConverter.toBigNumber(100000))
    .nid(IconConverter.toBigNumber(1))
    .version(IconConverter.toBigNumber(3))
    .timestamp(timestamp)
    .build();


const rawTx = IconConverter.toRawTransaction(param);
const transaction = JSON.stringify(rawTx);
const signTxData = {
    transport,
    appPrivateKey,
    appId,
    transaction,
    addressIndex
}

const signTx = await VeChain.signTransaction(signTxData)
```

## Methods

### getAddress

#### Description

Get address by address index.

The VET address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of folllowing BIP44 path:

```none
m/44'/818'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/818'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    addressIndex: number
    ): Promise<string> 
```

#### Arguments

|      Arg      |                  Description                 |    Type    |  Required |
|:-------------:|:--------------------------------------------:|:----------:|:--------:|
|   transport   | Object to communicate with CoolWallet device |  Transport | TRUE |
| appPrivateKey |   Private key for the connected application  |   string   | TRUE |
|     appId     |       ID for the connected application       |   string   | TRUE |
|  addressIndex |  The from address index in BIP44 derivation  |   number   | TRUE |

### signTransaction

#### Description

Sign VET Transaction. We suggest you to use [VET Official SDK](https://github.com/icon-project/icon-sdk-js) to build an unsigned transaction.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```

#### signTxType Arguments

|      Arg      |                              Description                             |    Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport |    TRUE   |
| appPrivateKey |               Private key for the connected application              |   string   |    TRUE   |
|     appId     |                   ID for the connected application                   |   string   |    TRUE   |
|  transaction  |          Essential information/property for VeChain Transaction         |   Object   |    TRUE   |
|  addressIndex |              The from address index in BIP44 derivation              |   number   |    TRUE   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  |   FALSE   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  |   FALSE   |

The signed transaction will be in form of `Object`, which you can use the official sdk to broadcast.
