# CoolWallet Coin Template

This is a template for developers who want to implement a new CoolWallet Coin SDK. Please list all the methods and describe what they supposedly be used for.


## Install

```shell
npm install @coolwallet/template
```

## Usage

```javascript
import Template from '@coolwallet/template'
const template = new Template(transport, appPrivateKey, appId)
```

### getAddress

Get address by address index.

```javascript
const address = await template.getAddress(0)
```

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
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
    chainId: 1
}
// sign with address index 0
const signedTx = await template.signTransaction(tx, 0)
```

