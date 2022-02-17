# CoolWallet Coin App - ETC

This is a template for developers who want to use ETC functionality with CoolWallet Pro.

## Install

```shell
npm install @coolwallet/ETC
```

## Usage

```javascript
import ETC from '@coolwallet/ETC'
const etc = new ETC(transport, appPrivateKey, appId)
```

### getAddress

Get address by address index.

```javascript
const address = await etc.getAddress(0)
```

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of folllowing BIP44 path:

```none
m/44'/61'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

### signTransaction

Sign Ethereum Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
const tx = {
    nonce: "0x21d",
    gasPrice: "0x59682f00",
    gasLimit: "0x5208",
    to: "0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C",
    value: "0x5af3107a4000",
    data: "0x00",
    chainId: 61
}
// sign with address index 0
const signedTx = await etc.signTransaction(tx, 0)
```

## Coin Tester

To run coin tester for testing ETC functionalities, please register for an account on GetBlock.io First. it's free for the first 40k requests. After finishing the application, simply paste the API key to to packages/coin-tester/src/components/coins/ETC/index.tsx line 9.

## More about Ethereum Classic

Ethereum Classic is one of the most popular coins in the crypto world with a top 50 market cap.
It's basically a fork from Ethereum with different chain Id and HD wallet path.
For more information about Ethereum Classic...
see official site [here](https://ethereumclassic.org/).


