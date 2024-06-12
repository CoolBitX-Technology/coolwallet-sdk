# CoolWallet Cardano SDK
Typescript library with support for the integration of Cardano for third party application, include the functionalities of generation of addresses and signed transactions. 

## Updates
1. Support combined register and delegate in single transaction.
2. Support testnet address.


## Install
```shell
npm install @coolwallet/ada
```

## Usage
```javascript
import ADA, { TransferWithoutFee, Options } from '@coolwallet/ada';

const ada = new ADA();
const acckey = await ada.getAccountPubKey(transport, appPrivateKey, appId);
const address = ada.getAddressByAccountKey(acckey, addressIndex);

const rawTx = {
  addrIndexes: [0],
  inputs: [{
    txId: '0x8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
    index: 0,
  }],
  output: {
    address: 'addr1qxn5anyxv6dhtl57yvgvpp25emy0pc9wenqzzemxktyr94ahaaap0f0tn4wxaqsydnzty2m0y4gfeu39ckjvsjycs4nssxhc25',
    amount: 10523059,
  },
  change: {
    address: 'addr1q8wyqhxud34ejxjm5tyj74qeuttr7z9vnjuxy6upyn2w8ryau3fvcuaywgncvz89verfyy24vverl9pw2h5uwv30aq9qm6xj7s',
    amount: 360000,
  },
  ttl: '0x641a5',
};

const transferTxSize = await ada.getTransactionSize(rawTx);

const fee = a * transferTxSize + b;
const transaction = {
  fee,
  ...rawTx
};
const options = { transport, appPrivateKey, appId };

const signedTx = await ada.signTransaction(transaction, options);
```

## Methods

### getAccountPubKey
#### Arguments
|      Arg      |                  Description                 |    Type   |  Required |
|:-------------:|:--------------------------------------------:|:---------:|:---------:|
| transport     | Object to communicate with CoolWallet device | Transport |    True   |
| appPrivateKey | Private key for the connected application    | string    |    True   |
| appId         | ID for the connected application             | string    |    True   |
#### Description
Cardano is using BIP32-Ed25519 and not standard BIP32. Because BIP32-Ed25519 has similar path structure to BIP32, we can still acquire the account public key and use it to generate addresses avoiding exposuring the private keys.
Read [CIP-1852](https://github.com/cardano-foundation/CIPs/blob/master/CIP-1852/README.md) to understand the key deriving.
```none
m / 1852' / 1815' / 0'
```

### getAddressByAccountKey
#### Arguments
|      Arg      |               Description               |    Type   |  Required |
|:-------------:|:---------------------------------------:|:---------:|:---------:|
|  acckey       |  The account key from getAccountPubKey  |   string  |    True   |
|  addressIndex |  The address index                      |   number  |    True   |
#### Description
The Cardano address format is combined with different part. Payment part indicates the ownership of the funds associated with the address. Delegation part indicates the owner of the stake rights associated with the address.
Read [CIP-0019](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0019/README.md) to understand the address encoding.
```none
Payment key: m / 1852' / 1815' / 0' / 0 / 0
Staking key: m / 1852' / 1815' / 0' / 2 / 0 <- index always be 0
```

### getTransactionSize
#### Arguments
|      Arg      |                       Description        |        Type        |  Required |
|:-------------:|:----------------------------------------:|:------------------:|:---------:|
|  transaction  |       Cardano transaction without fee    |   RawTransaction   |    True   |
|     txType    |       Cardano transaction type           |      TxTypes       |    True   |
```typescript
export type Integer = string | number;

export enum TxTypes {
  Transfer,
  StakeRegister,
  StakeDelegate,
  StakeDeregister,
  StakeWithdraw,
  StakeRegisterAndDelegate,
}

export interface Input {
  txId: string;
  index: Integer;
}

export interface Output {
  address: string;
  amount: Integer;
}

export interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
  output?: Output;
  poolKeyHash?: string;
  withdrawAmount?: Integer;
}
```
#### Description
Get Cardano Transaction size for ADA transfer. This method is for [fee calculating](https://docs.cardano.org/explore-cardano/fee-structure).
The a and b parameters can be fetched via [Latest epoch protocol parameters API](https://docs.blockfrost.io/#tag/Cardano-Epochs/paths/~1epochs~1latest~1parameters/get).
```none
Fee = a * size(tx) + b
```
References:
- TTL (Time to live) : [latest slot + N slots](https://developers.cardano.org/docs/stake-pool-course/handbook/create-simple-transaction/#determine-the-ttl-time-to-live-for-the-transaction)
- Get latest slot : https://cardano-mainnet.blockfrost.io/api/v0/blocks/latest
- https://iohk.io/en/blog/posts/2022/01/21/plutus-fee-estimator-find-out-the-cost-of-transacting-on-cardano/
- https://mantis.functionally.io/how-to/min-ada-value/
- https://docs.cardano.org/native-tokens/minimum-ada-value-requirement



### signTransaction
#### Arguments
|     Arg     |                       Description                         |  Type    |  Required |
|:-----------:|:---------------------------------------------------------:|:--------:|:---------:|
| transaction | Essential information/property for Cardano Transaction    | Transfer |    True   |
| options     | Arguments for coolwallet communication and authentication | Options  |    True   |
| txType      | Cardano transaction type                                  | TxTypes  |    True   |
```typescript
export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: Function;
  authorizedCB?: Function;
}

export interface Transaction extends RawTransaction {
  fee: Integer;
}
```
#### Description
Sign Cardano Transaction for ADA transfer. 



## Error Messages
| Submit tx error messages    |               Description                  |
|:---------------------------:|:------------------------------------------:|
| ValueNotConservedUTxO       | outputs and fee is not equal to utxos      |
| BadInputsUTxO               | utxo not found                             |
| FeeTooSmallUTxO             | fee small than a * size + b                |
| OutsideValidityIntervalUTxO | ttl small than latest Slot                 |
| OutputTooSmallUTxO          | output amount less than 999978             |
| MissingVKeyWitnessesUTXOW   | signature verifying failure                |
| DelegsFailure               | 沒有 Reward，但嘗試用 Withdraw 取值        |



## Staking

### Get account info by stake addresss
https://docs.blockfrost.io/#tag/Cardano-Accounts
``` json
{
  "stake_address": "stake1ux3g2c9dx2nhhehyrezyxpkstartcqmu9hk63qgfkccw5rqttygt7",
  "active": true,
  "active_epoch": 412,
  "controlled_amount": "619154618165",
  "rewards_sum": "319154618165",
  "withdrawals_sum": "12125369253",
  "reserves_sum": "319154618165",
  "treasury_sum": "12000000",
  "withdrawable_amount": "319154618165",
  "pool_id": "pool1pu5jlj4q9w9jlxeu370a3c9myx47md5j5m2str0naunn2q3lkdy"
}
```

### State Diagram
``` mermaid
stateDiagram-v2
    get_account_info --> active=false
    get_account_info --> pool_id
    get_account_info --> withdrawable_amount
    active=false --> active=true : Register
    active=true --> active=false : Deregister

    pool_id --> null
    pool_id --> has_value
    null --> new_pool_id : Delegate
    has_value --> new_pool_id : Delegate

    withdrawable_amount --> has_amount
    has_amount --> remaining_withdrawable_amount : Withdraw
```

## Tx Interfaces Requirement

### Transfer
```typescript
interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
  output: Output;
}
```

### Stake Register
```typescript
interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
}
```

### Stake Delegate
```typescript
interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
  poolKeyHash: string;
}
```

### Stake Deregister
```typescript
interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change?: Output;
  ttl: Integer;
}
```

### Stake Withdraw
```typescript
interface RawTransaction {
  addrIndexes: number[];
  inputs: Input[];
  change: Output;
  ttl: Integer;
  withdrawAmount: Integer;
}
```
