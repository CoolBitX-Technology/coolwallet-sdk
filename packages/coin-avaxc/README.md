# CoolWallet Avalanche C-Chain (AVAXC) SDK

Typescript library with support for the integration of Ethereum for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm install @coolwallet/avaxc
```

## Usage

```javascript
import AVAXC from '@coolwallet/avaxc'
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const avaxc = new AVAXC();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await avaxc.getAddress(transport, appPrivateKey, appId, addressIndex);

const transaction = {
    nonce: "0x21d",
    gasPrice: "0x59682f00",
    gasLimit: "0x5208",
    to: "0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C",
    value: "0x5af3107a4000",
    data: ""
}


const signTransaction = await avaxc.signTransaction(transport!, appPrivateKey, appId, , transaction);



const ERC20Transaction = {
    nonce: "0x85",
    gasPrice: "0x23a427985a",
    gasLimit: "0x72c2",
    to: "0xe41d2489571d322189246dafa5ebde1f4699f498",
    value: "0x0",
    symbol: 'LINK',
    decimals: '18' ,
		tokenSignature: 'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' ,
    data: "0x00"
}


const erc20Tx = await avaxc.signERC20Transaction(transport!, appPrivateKey, appId, addressIndex, ERC20Transaction);
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

Sign Avalanche C-Chain Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
async signTransaction(signTxData: types.signTx): Promise<string>
```

#### signTx Arguments

|      Arg      |                       Description                       |     Type    |  Required |
|:-------------:|:-------------------------------------------------------:|:-----------:|:---------:|
|   transport   |       Object to communicate with CoolWallet device      |  Transport  |    True   |
| appPrivateKey |        Private key for the connected application        |    string   |    True   |
|     appId     |             ID for the connected application            |    string   |    True   |
|  transaction  | Essential information/property for Ethereum Transaction | Transaction |    True   |
|  addressIndex |        The from address index in BIP44 derivation       |    number   |    True   |
|   publicKey   |              Public key of the from address             |    string   |    True   |

### signMessage

#### Description

Perform AVAXC `personal_sign`.

```javascript
async signMessage(signMsgData: types.signMsg): Promise<string>

```

#### signMsg Arguments

|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
|   transport   | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey |   Private key for the connected application  |   string  |    True   |
|     appId     |       ID for the connected application       |   string  |    True   |
|    message    |                Message to sign               |   string  |    True   |
|  addressIndex |  The from address index in BIP44 derivation  |   number  |    True   |

### signTypedData

#### Description

Perform AVAXC `sign_typed_data`.

```javascript
async signTypedData(typedData: types.signTyped): Promise<string>
```

#### signTyped Arguments

|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
|   transport   | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey |   Private key for the connected application  |   string  |    True   |
|     appId     |       ID for the connected application       |   string  |    True   |
|   typedData   |      Typed structured data to be signed      |    any    |    True   |
|  addressIndex |  The from address index in BIP44 derivation  |   number  |    True   |
