# CoolWallet Crypto.Org Chain (CRO) SDK

Typescript library with support for the integration of CRO for third party application, include the functionalities of generation of addresses, signed transactions, and staking.

## Install

```shell
npm i @coolwallet/cro
```

## Usage

```javascript
import CRO from '@coolwallet/cro';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const cro = new CRO();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const address = await cro.getAddress(transport, appPrivateKey, appId, 0);

const normalTransaction = {
    chainId: "crypto-org-chain-mainnet-1",
    txType: "MsgSend",
    fromAddress: "cro126xr8h8dk0fd2ptm5exsfz0mhf4da66670nvqc",
    toAddress: "cro1w2kvwrzp23aq54n3amwav4yy4a9ahq2kz2wtmj",
    amount: 10,
    feeAmount: 10000,
    gas: 300000,
    accountNumber: 121641,
    sequence: "14",
    memo: "test signature"
}

const signData = {
    transport,
    appPrivateKey,
    appId,
    addressIndex: 0,
    transaction: normalTransaction,
    txType: TX_TYPE.SEND,
}

const normalTx = await cro.signTransaction(signData);
```

## Methods

### getAddress

#### Description

Get address by address index.

The CRO address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/394'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/394'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: Transport, 
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

Sign CRO Transaction.

```javascript
async signTransaction(signData: types.SignDataType): Promise<string>
```

#### SignType Arguments

|      Arg      |                              Description                             |    Type   |  Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string  |    True   |
|     appId     |                   ID for the connected application                   |   string  |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   False   |
|    tx_Type    |      Type of transaction (SEND, DELEGATE, UNDELEGATE, WITHDRAW)      |  TX_TYPE  |    True   |
|  transaction  |      The transaction interface based on the type of transaction      | Interface |    True   |

Crypto.Org Chain transaction can be extended based on the `tx_type` for **staking** purposes, which could be `SEND`, `DELEGATE`, `UNDELEGATE`, or `WITHDRAW`.

### MsgSend

#### Description

To transfer CRO

#### Arguments

|     Arg     |            Description           |  Type  |  Required |
|:-----------:|:--------------------------------:|:------:|:---------:|
| fromAddress | From address for the transaction | string |    True   |
|  toAddress  |  To address for the transaction  | string |    True   |
|    amount   |        Amount to transfer        | number |    True   |

### MsgDelegate & MsgUndelegate

#### Description

To delegate & to undelegate CRO

#### Arguments

|        Arg       |      Description      |  Type  |  Required |
|:----------------:|:---------------------:|:------:|:---------:|
| delegatorAddress |  Address of delegator | string |    True   |
| validatorAddress |  Address of validator | string |    True   |
|      amount      | Amount for delegating | number |    True   |

```javascript
const delegate = {
    delegatorAddress: "cro139nl5fnhlxu2asduu5zqq8zzev0632jl2uupl8",
    validatorAddress: "crocncl139nl5fnhlxu2asduu5zqq8zzev0632jlf3lgam",
    amount: 100000
}

const undelegate = {
    delegatorAddress: "cro139nl5fnhlxu2asduu5zqq8zzev0632jl2uupl8",
    validatorAddress: "crocncl139nl5fnhlxu2asduu5zqq8zzev0632jlf3lgam",
    amount: 100000
}
```

### MsgWithdrawDelegationReward

#### Description

To withdraw the delegation and claim the reward

#### Arguments

|        Arg       |      Description     |  Type  |  Required |
|:----------------:|:--------------------:|:------:|:---------:|
| delegatorAddress | Address of delegator | string |    True   |
| validatorAddress | Address of validator | string |    True   |

```javascript
const withDrawDelegationReward = {
    delegatorAddress: "cro139nl5fnhlxu2asduu5zqq8zzev0632jl2uupl8",
    validatorAddress: "crocncl139nl5fnhlxu2asduu5zqq8zzev0632jlf3lgam"
}
```