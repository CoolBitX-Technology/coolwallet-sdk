# CoolWallet Bitcoin Cash (BCH) SDK

Typescript library with support for the integration of BCH for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm i @coolwallet/bch
```

## Usage

```javascript
import BCH from '@coolwallet/bch';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const bch = new BCH();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const address = await bch.getAddress(transport, appPrivateKey, appId, 0);

const signTxData = {
    tranpsort,
    appPrivateKey,
    appId,
    scriptType: 0,
    inputs: [{
        preTxHash: "9d717e7f9fb55c0591eb0f59999866091c592c55234a7024230123e1731524b5",
        preIndex: 0,
        preValue: "500000",
        sequence: 0xFFFFFFFF,
        addressIndex: 2,
        pubkeyBuf: Uint8Array(33)
    }],
    output: {
        value: "10000",
        address: "qzr809ywhqvhrlhq5nd9m78kmn3p20qm5y07gj0p8v",
    },
    change: {
        value: "489835",
        addressIndex: 1,
        pubkeyBuf: Uint8Array(33)
    }
}

const tx = await bch.signTransaction(signTxData);
```

## Methods

### getAddress

#### Description

The BCH address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/145'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/145'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: types.Transport, 
    appPrivateKey: string, 
    appId: string, 
    addressIndex: number
): Promise<string>
```

#### Arguments

|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
|   transport   | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey |   Private key for the connected application  |   string  |    True   |
|     appId     |       ID for the connected application       |   string  |    True   |
|  addressIndex |  The from address index in BIP44 derivation  |   number  |    True   |

### signTransaction

#### Description

Sign BCH Transaction.

```javascript
async signTransaction(signTxData: types.signTxType): Promise<string>
```

#### signTxType Arguments

|      Arg      |                              Description                             |    Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string   |    True   |
|     appId     |                   ID for the connected application                   |   string   |    True   |
|   scriptType  |               Define the type of script of the address               | ScriptType |    True   |
|     inputs    |            Array of inputs of previous transactions (UTXO)           |  [Inputs]  |    True   |
|     output    |                       Output of the transaction                      |   Output   |    True   |
|     change    |                      Address to receive changes                      |   Change   |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  |   False   |