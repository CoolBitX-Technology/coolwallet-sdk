# CoolWallet Ethereum SDK

Typescript library with support for the integration of Ethereum for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/eth
```

## Usage

```javascript
import ETH from '@coolwallet/eth'
const eth = new ETH(transport, appPrivateKey, appId)

const address = await eth.getAddress(transport, appPrivateKey, appId, 0);

const transaction = {
    nonce: "0x21d",
    gasPrice: "0x59682f00",
    gasLimit: "0x5208",
    to: "0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C",
    value: "0x5af3107a4000",
    data: "0x00",
    chainId: 1
}
const normalTx = await eth.signTransaction(signTx);

const erc20Transaction = {
    nonce: "0x85",
    gasPrice: "0x23a427985a",
    gasLimit: "0x72c2",
    to: "0xe41d2489571d322189246dafa5ebde1f4699f498",
    value: "0x0",
    data: "0x00",
    chainId: 1,
    option: {
      symbol: "USDT",
      unit: "6"
    }
}

const erc20Tx = await eth.erc20Transaction(signTx, tokenSignature);
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

|      Arg      |                  Description                 |    Type   |  Default |
|:-------------:|:--------------------------------------------:|:---------:|:--------:|
|   transport   | Object to communicate with CoolWallet device | Transport | Required |
| appPrivateKey |   Private key for the connected application  |   string  | Required |
|     appId     |       ID for the connected application       |   string  | Required |
|  addressIndex |  The from address index in BIP44 derivation  |   number  | Required |


### signTransaction

#### Description

Sign Ethereum Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
async signTransaction(signTxData: types.signTx): Promise<string>
```

#### signTx Arguments

|      Arg      |                       Description                       |     Type    |  Default |
|:-------------:|:-------------------------------------------------------:|:-----------:|:--------:|
|   transport   |       Object to communicate with CoolWallet device      |  Transport  | Required |
| appPrivateKey |        Private key for the connected application        |    string   | Required |
|     appId     |             ID for the connected application            |    string   | Required |
|  transaction  | Essential information/property for Ethereum Transaction | Transaction | Required |
|  addressIndex |        The from address index in BIP44 derivation       |    number   | Required |
|   publicKey   |              Public key of the from address             |    string   | Required |


### signMessage

#### Description

Perform ethereum `personal_sign`.

```javascript
async signMessage(signMsgData: types.signMsg): Promise<string> 

```

#### signMsg Arguments

|      Arg      |                  Description                 |    Type   |  Default |
|:-------------:|:--------------------------------------------:|:---------:|:--------:|
|   transport   | Object to communicate with CoolWallet device | Transport | Required |
| appPrivateKey |   Private key for the connected application  |   string  | Required |
|     appId     |       ID for the connected application       |   string  | Required |
|    message    |                Message to sign               |   string  | Required |
|  addressIndex |  The from address index in BIP44 derivation  |   number  | Required |

### signTypedData

#### Description

Perform ethereum `sign_typed_data`.

```javascript
async signTypedData(typedData: types.signTyped): Promise<string>
```

#### signTyped Arguments

|      Arg      |                  Description                 |    Type   |  Default |
|:-------------:|:--------------------------------------------:|:---------:|:--------:|
|   transport   | Object to communicate with CoolWallet device | Transport | Required |
| appPrivateKey |   Private key for the connected application  |   string  | Required |
|     appId     |       ID for the connected application       |   string  | Required |
|   typedData   |      Typed structured data to be signed      |    any    | Required |
|  addressIndex |  The from address index in BIP44 derivation  |   number  | Required |





