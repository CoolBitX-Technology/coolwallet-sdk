# CoolWallet Binance Coin (BNB) SDK

Typescript library with support for the integration of BNB for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm install @coolwallet/bnb
```

## Usage

```javascript
import BNB from '@coolwallet/bnb';
const bnb = new BNB();

const address = await bnb.getAddress(transport, appPrivateKey, appId, 0);

const transaction = {
  account_number: '39',
  chain_id: 'Binance-Chain-Tigris',
  data: null,
  memo: '',
  msgs: [
    {
      inputs: [
        {
          address: 'bnb16xjz4q2lc63nnmxchlxsj0w34q6lgrsnhff60l',
          coins: [{ amount: 1000, denom: 'BNB' }],
        },
      ],
      outputs: [
        {
          address: 'bnb1uzsh50kfmh73m8ytfcta7p3zceull2ycnttw5s',
          coins: [{ amount: 1000, denom: 'BNB' }],
        },
      ],
    },
  ],
  sequence: '503',
  source: '711',
}
const normalTx = await bnb.signTransaction(signData);
```

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/714'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/714'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: Types.Transport, 
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


### Sign Transactions

CoolWallet currently support 3 types of Binance DEX transaction: Transfer, PlaceOrder and CancelOrder.

#### signTransfer

#### Description

Sign BNB Transaction

```javascript
async signTransaction(signData: signType,): Promise<string>
```

#### signType Arguments

|      Arg      |                              Description                             |    Type   |  Required |
|:-------------:|:--------------------------------------------------------------------:|:---------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             | Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string  |    True   |
|     appId     |                   ID for the connected application                   |   string  |    True   |
|    signObj    |              Signing object for BNB Transfer transaction             |  Transfer |    True   |
| signPublicKey |                  Public key for signing transaction                  |   Buffer  |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number  |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function |   False   |


#### placeOrder

#### Description

Sign BNB Place Order Transaction

```javascript
async signPlaceOrder(signData: signPlaceOrderType): Promise<string>
```

#### signPlaceOrderType Arguments

|      Arg      |                              Description                             |    Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:----------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport |    True   |
| appPrivateKey |               Private key for the connected application              |   string   |    True   |
|     appId     |                   ID for the connected application                   |   string   |    True   |
|    signObj    |             Signing object for BNB PlaceOrder transaction            | PlaceOrder |    True   |
| signPublicKey |                  Public key for signing transaction                  |   Buffer   |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |   number   |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |  Function  |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |  Function  |   False   |

#### cancelOrder

#### Description

Sign BNB Cancel Order Transaction

```javascript
async signCancelOrder(signData: signCancelOrderType): Promise<string> 
```

#### signCancelOrderType Arguments

|      Arg      |                              Description                             |     Type    |  Required |
|:-------------:|:--------------------------------------------------------------------:|:-----------:|:---------:|
|   transport   |             Object to communicate with CoolWallet device             |  Transport  |    True   |
| appPrivateKey |               Private key for the connected application              |    string   |    True   |
|     appId     |                   ID for the connected application                   |    string   |    True   |
|    signObj    |            Signing object for BNB CancelOrder transaction            | CancelOrder |    True   |
| signPublicKey |                  Public key for signing transaction                  |    Buffer   |    True   |
|  addressIndex |              The from address index in BIP44 derivation              |    number   |    True   |
|   confirmCB   |      Callback of confirmation data to the connected application      |   Function  |   False   |
|  authorizedCB | Callback of authorized transaction data to the connected application |   Function  |   False   |
