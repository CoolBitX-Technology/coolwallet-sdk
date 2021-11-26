# CoolWallet Ethereum SDK

Typescript library with support for the integration of Ethereum for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/eth
```

## Usage

```javascript
import ETH from '@coolwallet/ETH'
const eth = new ETH(transport, appPrivateKey, appId)

const transport = new Transport();
const appPrivateKey = '57a1c4ecdfc2dad7d392bf0f707ddd7280623f1b7de21e5efd42895b4b178737';
const appId = '0533ac5f177331221642adc02f7265bc3edb84d1';

const address = await.ETH.getAddress(transport, appPrivateKey, appId, 0);
const tx = await ETH.signTransaction(signTx);
const message = await ETH.signMessage(signMsg);
const typedData = await ETH.signTypedData(signTyped);
```

## Methods
### getAddress

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

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

### signTransaction

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

white_check_mark
eyes
raised_hands





