# CoolWallet Tron (TRX) SDK

Typescript library with support for the integration of TRX for third party application, include the functionalities of generation of addresses, signed transactions, and staking.

## Install

```shell
npm install @coolwallet/trx
```

## Usage

```javascript
import TRX from '@coolwallet/trx';
const trx = new TRX();

const address = await trx.getAddress(transport, appPrivateKey, appId, 0);

const transaction = {
    refBlockBytes: "c75b",
    refBlockHash: "7cfc890c6e4d7a15",
    expiration: 1583304414000,
    timestamp: 1583268416080,
    contract: {
        ownerAddress: "41bf97a54f4b829c4e9253b26024b1829e1a3b1120",
        toAddress: "41859009fd225692b11237a6ffd8fdba2eb7140cca",
        amount: 100000000
    }
}
const normalTx = await trx.signTransaction(signTxData);

const trc20Transaction = {
    refBlockBytes: "5a40",
    refBlockHash: "12cd29483be4900a",
    expiration: 1638339660000,
    timestamp: 1638339602030,
    contract: {
        ownerAddress: "411634b4103bd6feb3a9f9e9eb937f484c3c8b0046",
        contractAddress: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
        receiverAddress: "4139e6a453301f6d5d228966dd8d742f1f861bd40f",
        amount: 2000000
    }
    feeLimit: 150000000,
    option: {
        symbol: "USDT",
        decimals: 6
    }
}
const trc20Tx = await trx.signTRC20Transfer(signTxData)
```

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/195'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/195'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
	transport: type.Transport,
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
The `SignTxData` and `Transaction` arguments are the essentail data fields for TRX transactions. Depends on the type of transaction, the extended arguments may vary.

#### SignTxData Arguments

|      Arg      |                              Description                             |    Type   |  Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string  |    True   |
|     appId     |                   ID for the connected application                   |   string  |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   False   |

#### Transaction Arguments

|      Arg      |                         Description                        |  Type  | Required |
|:-------------:|:----------------------------------------------------------:|:------:|:--------:|
| refBlockBytes |   Reference to the bytes of the hash of the latest block   | string |   True   |
|  refBlockHash |  Reference to the bytes of the height of the latest block  | string |   True   |
|   expiration  | The time period between transaction creation and broadcast | number |   True   |
|   timestamp   |               Timestamps for the transaction               | number |   True   |

 The extended arguments may vary depend on the type of the transaction. The transaction can be for **transfering** (`signTransaction`, `signTRC20Transfer`) or **staking** (`signFreeze`, `signUnfreeze`, `signVoteWitness`, `signWithdrawBalance`) purposes.

### signTransaction

#### Description

Sign TRX Transaction.

```javascript
async signTransaction(signTxData: type.NormalTradeData): Promise<string> 
```

#### NormalContract Arguments

|      Arg     |       Description      |       Type       | Required |
|:------------:|:----------------------:|:----------------:|:--------:|
| ownerAddress |    The from address    |      string      |   True   |
|   toAddress  |     The to address     |      string      |   True   |
|    amount    | The amount to transfer | number \| string |   True   |

### signTRC20Transfer

#### Description

Sign TRC20 Transfering Transaction

```javascript
async signTRC20Transfer(signTxData: type.TRC20TransferData): Promise<string>
```

#### TRC20TransferContract Arguments

|       Arg       |           Description          |       Type       | Required |
|:---------------:|:------------------------------:|:----------------:|:--------:|
|   ownerAddress  |        The from address        |      string      |   True   |
| contractAddress | Address of the TRC-20 contract |      string      |   True   |
| receiverAddress |         The to address         |      string      |   True   |
|      amount     |     The amount to transfer     | number \| string |   True   |