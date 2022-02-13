# CoolWallet Tezos (XTZ) SDK

Typescript library with support for the integration of Tezos (XTZ) for third party applications, include the functionalities of generation of addresses, signed transactions, and baking.

## Install

```shell
npm install @coolwallet/xtz
```

## Usage

```javascript
import XTZ from '@coolwallet/xtz';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const xtz = new XTZ();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const address = await xtz.getAddress(transport, appPrivateKey, appId, 0);

const normalTransaction = {
    brance: "BKiXcfN1ZTXnNNbTWSRArSWzVFc6om7radWq5mTqGX6rY4P2Uhe",
    source: "tz1YU2zoyCkXPKEA4jknSpCpMs7yUndVNe3S",
    fee: "1520",
    counter: "2622173",
    gas_limit: "10500",
    storage_limit: "300",
    amount: "300000",
    destination: "tz2FwBnXhuXvPAUcr1aF3uX84Z6JELxrdYxD"
};

const signTxData = {
  transport,
  appPrivateKey,
  appId,
  addressIndex: 0
}

const normalTx = await xtz.signTransaction(signTxData, normalTransaction);
```

## Methods

### getAddress

#### Description

Get address by address index.

The XTZ address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/1729'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/1729'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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

### getPublicKeyHash

#### Description

Get public key hash by address index.

The XTZ public key hash generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getPublicKeyHash` with `addressIndex = i` will get the public key hash of folllowing path:

```none
m/44'/1729'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/1729'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getPublicKeyHash(
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
The `SignTxData` and `xtzOperation` arguments are the essentail data fields for XTZ operations. Depends on the type of operation, the extended arguments may vary.

#### SignTxData Arguments

|      Arg      |                              Description                             |    Type   |  Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string  |    True   |
|     appId     |                   ID for the connected application                   |   string  |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   False   |

#### xtzOperation Arguments

|         Arg        |                                 Description                                |  Type  | Required |
|:------------------:|:--------------------------------------------------------------------------:|:------:|:--------:|
|        branch      |                      The hash of the checkpoint block                      | string |   True   |
|        source      |                     The from address of the transaction                    | string |   True   |
|         fee        |                     The number of the checkpoint block                     | string |   True   |
|       counter      |                       The nonce of the transaction                         | string |   True   |
|      gas_limit     |                  The current spec version for the runtime                  | string |   True   |
|    storage_limit   |                  The tip to increase transaction priority                  | string |   True   |

The extended arguments may vary depend on the type of the operation. The operation can be for **transfering** (`signTransaction`), **revealing** (`signReveal`) or **baking** (`signDelegation`, `signUndelegation`) purposes.

### signTransaction

#### Description

Sign XTZ Transaction Operation for Transfering

```javascript
async signTransaction(signTxData: SignTxData, operation: types.xtzTransaction) 
```

#### Extended Arguments

|     Arg     |     Description     |  Type  | Required |
|:-----------:|:-------------------:|:------:|:--------:|
|    amount   |  Value to transfer  | string |   True   |
| destination | Destination address | string |   True   |
|  parameters |  Data for contract  | string |   false  |

### signReveal

#### Description

Sign XTZ Reveal Operation for Revealing Public Key of Manager

```javascript
async signReveal(signTxData: SignTxData, operation: types.xtzReveal) 
```

#### Extended Arguments

|     Arg     |          Description       |  Type  | Required |
|:-----------:|:--------------------------:|:------:|:--------:|
|  public_key | Public key hash of manager | string |   True   |

### signDelegation

#### Description

Sign XTZ Delegation Operation for Delegating

```javascript
async signDelegation(signTxData: SignTxData, operatopn: types.xtzDelegation) 
```

#### Extended Arguments

|     Arg     |     Description       |  Type  | Required |
|:-----------:|:---------------------:|:------:|:--------:|
|   delegate  |    Address of baker   | string |   True   |

### signUndelegation

#### Description

Sign XTZ Delegation Operation for Undelegating

```javascript
async signUndelegation(signTxData: SignTxData, operation: xtzDelegation) 
```

#### Extended Arguments

None