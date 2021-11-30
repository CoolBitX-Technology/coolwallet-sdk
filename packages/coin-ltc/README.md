# CoolWallet Litecoin (LTC) SDK
[![Version](https://img.shields.io/npm/v/@coolwallet/ltc)](https://www.npmjs.com/package/@coolwallet/ltc)

Typescript library with support for the integration of Bitcoin for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm i @coolwallet/ltc
```

## Usage

```javascript
import LTC from '@coolwallet/ltc'
const ltc = new LTC()

const address = await ltc.getAddress(transport, appPrivateKey, appId, scriptType, 0);

const transaction = {
    scriptType: 1,
    inputs:{
        preTxHash: "735153f57da91462a01c17937a397aa67f7b5faf9ab74ebcdd4c8f485aba26f5",
        preIndex: 1,
        preValue: "87302",
        sequence: 0xFFFFFFFF,
        addressIndex: 0,
        pubkeyBuf: Uint8Array(33)
    },
    output: {
        value: "10000",
        address: "MSea9ZqgrZqsB5bvg8iTrcUQ2xpF1ckAsv",
    },
    change: {
        value: "77301.99983500001",
        addressIndex: 0,
        pubkeyBuf: Uint8Array(33)
    }
}
const normalTx = await ltc.signTransaction(signTxData)
```

## Methods

### getAddress

#### Description

Get address by address index.

The LTC address generated is compatible to BIP141 (SegWit Proposal) and BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/2'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/2'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    scriptType: ScriptType, 
    addressIndex: number
    ): Promise<string> 
```

#### Arguments

|      Arg      |                  Description                 |    Type    |  Required |
|:-------------:|:--------------------------------------------:|:----------:|:--------:|
|   transport   | Object to communicate with CoolWallet device |  Transport | TRUE |
| appPrivateKey |   Private key for the connected application  |   string   | TRUE |
|     appId     |       ID for the connected application       |   string   | TRUE |
|   scriptType  |   Define the type of script of the address   | ScriptType | TRUE |
|  addressIndex |  The from address index in BIP44 derivation  |   number   | TRUE |

### signTransaction

#### Description

Sign Litecoin Transaction.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```

#### signTxType Arguments

|      Arg      |                              Description                             |    Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport | TRUE |
| appPrivateKey |               Private key for the connected application              |   string   | TRUE |
|     appId     |                   ID for the connected application                   |   string   | TRUE |
|   scriptType  |               Define the type of script of the address               | ScriptType | TRUE |
|     inputs    |            Array of inputs of previous transactions (UTXO)           |  [Inputs]  | TRUE |
|     output    |                       Output of the transaction                      |   Output   | TRUE |
|     change    |                      Address to receive changes                      |   Change   | TRUE |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  | FALSE |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  | FALSE |
