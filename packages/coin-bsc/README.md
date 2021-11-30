# CoolWallet Binance Smart Chain (BSC) SDK

Typescript library with support for the integration of BSC for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/bsc
```

## Usage

```javascript
import BSC from '@coolwallet/bsc'
const bsc = new BSC()

const address = await bsc.getAddress(transport, appPrivateKey, appId, 0);

const transaction = {
    nonce: "0x87",
    gasPrice: "0x12a05f200",
    gasLimit: "0xcf08",
    to: "0x8A1628c2397F6cA75579A45E81EE3e17DF19720e",
    value: "xe8d4a51000",
    data: "",
    chainId: 56
}
const normalTx = await bsc.signTransaction(signTxData);

const bep20Transaction = {
    nonce: "0x87",
    gasPrice: "0x12a05f200",
    gasLimit: "0x5208",
    to: "0x55d398326f99059ff775485246999027b3197955",
    value: "0x0",
    data: "0xa9059cbb000000000000000000000000BDCc4DBd6",
    chainId: 56,
    option: {
      symbol: "USDT",
      unit: "18"
    }
}
const bep20Tx = await bsc.bep20Transaction(signTxData, tokenSignature);
```

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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

Sign BSC Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
async signTransaction(signTxData: types.signTx)
```

#### signTx Arguments

|      Arg      |                              Description                             |     Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:-----------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport  |    True   |
| appPrivateKey |               Private key for the connected application              |    string   |    True   |
|     appId     |                   ID for the connected application                   |    string   |    True   |
|  transaction  |          Essential information/property for BSC Transaction          | Transaction |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |    number   |    True   |
|   publicKey   |                    Public key of the from address                    |    string   |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |   Function  |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |   Function  |   False   |

### signMessage

#### Description

Perform BSC `personal_sign`.

```javascript
async signMessage(signMsgData: types.signMsg): Promise<string> 

```

#### signMsg Arguments

|      Arg      |                         Description                        |    Type   |  Required |
|:-------------:|:----------------------------------------------------------:|:---------:|:---------:|
|   transport   |        Object to communicate with CoolWallet device        | Transport |    True   |
| appPrivateKey |          Private key for the connected application         |   string  |    True   |
|     appId     |              ID for the connected application              |   string  |    True   |
|    message    |                       Message to sign                      |   string  |    True   |
|  addressIndex |         The from address index in BIP44 derivation         |   number  |    True   |
|   confirmCB   | Callback of confirmation data to the connected application |  Function |   False   |
|  authorizedCB |  Callback of authorized data to the connected application  |  Function |   False   |

### signTypedData

#### Description

Perform BSC `sign_typed_data`.

```javascript
async signTypedData(typedData: types.signTyped)
```

#### signTyped Arguments

|      Arg      |                         Description                        |    Type   |  Required |
|:-------------:|:----------------------------------------------------------:|:---------:|:---------:|
|   transport   |        Object to communicate with CoolWallet device        | Transport |    True   |
| appPrivateKey |          Private key for the connected application         |   string  |    True   |
|     appId     |              ID for the connected application              |   string  |    True   |
|   typedData   |             Typed structured data to be signed             |    any    |    True   |
|  addressIndex |         The from address index in BIP44 derivation         |   number  |    True   |
|   confirmCB   | Callback of confirmation data to the connected application |  Function |   False   |
|  authorizedCB |  Callback of authorized data to the connected application  |  Function |   False   |
