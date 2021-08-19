# CoolWallet Binance (BNB) App

![version](https://img.shields.io/npm/v/@coolwallet/bnb)

## Install

```shell
npm install @coolwallet/bnb
```

## Usage

```javascript
import cwsBNB from '@coolwallet/bnb';
const BNB = new cwsBNB(transport, appPrivateKey, appId);
```

### getAddress

Get address by address index.

```javascript
const address = await BNB.getAddress(0);
console.log(address);

// bnb16xjz4q2lc63nnmxchlxsj0w34q6lgrsnhff60l
```

### Sign Transactions

CoolWallet currently support 3 types of Binance DEX transaction: Transfer, PlaceOrder and CancelOrder.

#### signTransfer

```javascript

const tx = {
  account_number: '39',
  chain_id: 'Binance-Chain-Tigris',
  data: null,
  memo: '',
  msgs: [
    {
      inputs: [
        {
          address: 'bnb16xjz4q2lc63nnmxchlxsj0w34q6lgrsnhff60l', // your address
          coins: [{ amount: amount, denom: 'BNB' }],
        },
      ],
      outputs: [
        {
          address: 'bnb1uzsh50kfmh73m8ytfcta7p3zceull2ycnttw5s', // destination address
          coins: [{ amount: amount, denom: 'BNB' }],
        },
      ],
    },
  ],
  sequence: '503',
  source: '1',
}

const signature = await BNB.signTransfer(tx, 0) // sign it with address index 0

```

#### placeOrder

```javascript

// place order tx object
const tx = {
  account_number: '39',
  chain_id: 'Binance-Chain-Tigris',
  data: null,
  memo: '',
  msgs: [
    {
      id: 'D1A42A815FC6A339ECD8BFCD093DD1A835F40E13-505',
      ordertype: 2,
      price: 29333,
      quantity: 1000000000,
      sender: 'bnb16xjz4q2lc63nnmxchlxsj0w34q6lgrsnhff60l',
      side: 1,
      symbol: 'PYN-C37_BNB',
      timeinforce: 1,
    },
  ],
  sequence: '504',
  source: '1',
}

const signature = await BNB.placeOrder(tx, 0) // sign it with address index 0

```

#### cancelOrder

```javascript

// CancelOrder tx object
const tx = {
  account_number: '39',
  chain_id: 'Binance-Chain-Tigris',
  data: null,
  memo: '',
  msgs: [
    {
      refid: 'D1A42A815FC6A339ECD8BFCD093DD1A835F40E13-506',
      sender: address,
      symbol: 'PYN-C37_BNB',
    },
  ],
  sequence: '506',
  source: '1',
}

const signature = await BNB.cancelOrder(tx, 0) // sign it with address index 0

```
