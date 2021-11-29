# CoolWallet Bitcoin SDK

Typescript library with support for the integration of Bitcoin for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm i @coolwallet/btc
```

## Usage

```javascript
import BTC from '@coolwallet/btc'
const btc = new BTC(transport, appPrivateKey, appId)

const address = await btc.getAddress(transport, appPrivateKey, appId, scriptType, 0);

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
        address: "3442qW39131y5Q8qR963ehjmxXPAXUWn7Q",
    },
    change: {
        value: "77301.99983500001",
        addressIndex: 0,
        pubkeyBuf: Uint8Array(33)
    }
}
const normalTx = await btc.signTransaction()

const usdtTransaction = {
    scriptType: 1,
    inputs:{
        preTxHash: "735153f57da91462a01c17937a397aa67f7b5faf9ab74ebcdd4c8f485aba26f5",
        preIndex: 1,
        preValue: 87302,
        sequence: 0xFFFFFFFF,
        addressIndex: 0,
        pubkeyBuf: Uint8Array(33)
    },
    output: {
        value: "546",
        address: "3442qW39131y5Q8qR963ehjmxXPAXUWn7Q",
    },
    change: {
        value: "69926",
        addressIndex: 0,
        pubkeyBuf: Uint8Array(33)
    }
}
const usdtTx = await btc.signUSDTTransaction()
```

## Methods

### getAddress

#### Description

Get address by address index.

The BTC address generated is compatible to BIP141 (SegWit Proposal) and BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/0'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/0'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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

|      Arg      |                  Description                 |    Type    |  Default |
|:-------------:|:--------------------------------------------:|:----------:|:--------:|
|   transport   | Object to communicate with CoolWallet device |  Transport | Required |
| appPrivateKey |   Private key for the connected application  |   string   | Required |
|     appId     |       ID for the connected application       |   string   | Required |
|   scriptType  |   Define the type of script of the address   | ScriptType | Required |
|  addressIndex |  The from address index in BIP44 derivation  |   number   | Required |

### signTransaction

#### Description

Sign Bitcoin Transaction.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```

#### signTxType Arguments

|      Arg      |                              Description                             |    Type    |  Default |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport | Required |
| appPrivateKey |               Private key for the connected application              |   string   | Required |
|     appId     |                   ID for the connected application                   |   string   | Required |
|   scriptType  |               Define the type of script of the address               | ScriptType | Required |
|     inputs    |            Array of inputs of previous transactions (UTXO)           |  [Inputs]  | Required |
|     output    |                       Output of the transaction                      |   Output   | Required |
|     change    |                      Address to receive changes                      |   Change   | Required |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  | Required |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  | Required |

### signUSDTTransaction

#### Description

Sign USDT Transaction

```javascript
async signUSDTTransaction(signUSDTTxData: signUSDTTxType): Promise<string>
```

#### signUSDTTxType Arguments

|      Arg      |                              Description                             |    Type    |  Default |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:--------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport | Required |
| appPrivateKey |               Private key for the connected application              |   string   | Required |
|     appId     |                   ID for the connected application                   |   string   | Required |
|   scriptType  |               Define the type of script of the address               | ScriptType | Required |
|     inputs    |            Array of inputs of previous transactions (UTXO)           |  [Inputs]  | Required |
|     output    |                       Output of the transaction                      |   Output   | Required |
|     value     |                      Amount of USDT to transfer                      |   string   | Required |
|     change    |                      Address to receive changes                      |   Change   | Required |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  | Required |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  | Required |