# CoolWallet Polkadot (DOT) SDK

Typescript library with support for the integration of DOT for third party application, include the functionalities of generation of addresses, signed transactions, and staking.

## Install

```shell
npm install @coolwallet/dot
```

## Usage

```javascript
import DOT from '@coolwallet/dot'
const dot = new DOT()

const address = await dot.getAddress(transport, appPrivateKey, appId, 0);

const transaction = {
    fromAddress: "13v5sr4E8TLLfnA6ytPQwkA5HsEivYFpvaBATj5dDyDa38mY",
    blockHash: "0x5c697847b25d385178aa150d29e5ce212339c5624183f74bdf45f4912c89749a",
    blockNumber: "999",
    era: "256",
    genesisHash: "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3",
    nonce: "33",
    specVersion: "666",
    tip: "22",
    transactionVersion: "333",
    version: 4,
    method: {
        destAddress: "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3",
        value: 10000 
    }
}
const normalTx = await dot.signTransaction(signTxData);
```

## Methods

### getAddress

#### Description

Get address by address index.

The DOT address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/354'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/354'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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


### Sign Transaction

#### Description

CoolWallet currently support various signing methods and contracts based on the type of the transaction.
The `SignTxData` and `dotTransaction` arguments are the essentail data fields for DOT transactions. Depends on the type of transaction, the extended arguments may vary.

#### SignTxData Arguments

|      Arg      |                              Description                             |    Type   |  Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string  |    True   |
|     appId     |                   ID for the connected application                   |   string  |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   False   |

#### dotTransaction Arguments

|         Arg        |                                 Description                                |  Type  | Required |
|:------------------:|:--------------------------------------------------------------------------:|:------:|:--------:|
|     fromAddress    |                     The from address of the transaction                    | string |   True   |
|      blockHash     |                      The hash of the checkpoint block                      | string |   True   |
|     blockNumber    |                     The number of the checkpoint block                     | string |   True   |
|         era        | The number of blocks after the checkpoint for which a transaction is valid | string |   True   |
|     genesisHash    |                        The genesis hash of the chain                       | string |   True   |
|        nonce       |                        The nonce of the transaction                        | string |   True   |
|     specVersion    |                  The current spec version for the runtime                  | string |   True   |
|         tip        |                  The tip to increase transaction priority                  | string |   True   |
| transactionVersion |                 The current version for transaction format                 | string |   True   |
|       version      |                               Version number                               | number |   True   |

The extended arguments may vary depend on the type of the transaction. The transaction can be for **transfering** (`signTransaction`) or **staking** (`signBondTransaction`, `signBondExtraTransaction`, `signUnbondTransaction`, `signNominateTransaction`, `signWithdrawUnbondedTransaction`, `signChillTransaction`) purposes.

### signTransaction

#### Description

Sign DOT Transfer Transaction

```javascript
async signTransaction(signTxData: types.NormalTransferData) 
```

### NormalMethod Arguments

|     Arg     |     Description     |  Type  | Required |
|:-----------:|:-------------------:|:------:|:--------:|
| destAddress | Destination address | string |   True   |
|    value    |  Value to transfer  | string |   True   |
