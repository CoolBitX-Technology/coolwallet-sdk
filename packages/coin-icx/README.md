# CoolWallet Icon (ICX) App

ICON API of CoolWallet.

![version](https://img.shields.io/npm/v/@coolwallet/icx)

## Install

```shell
npm install @coolwallet/icx
```

## Usage

```javascript
import cwsICX from '@coolwallet/icx'
const ICON = new cwsICX(transport, appPrivateKey, appId)
```

### getAddress

Get address by address index.

```javascript
const address = await ICON.getAddress(0)
console.log(address)

// hx76f46307b53686f2dd4a2c8ca2f22492e842c4bf
```

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

### signTransaction

Sign ICON Transaction. We suggest you to use [Icon Official SDK](https://github.com/icon-project/icon-sdk-js) to build an unsigned transaction.

```javascript

const txObj = new IconBuilder.IcxTransactionBuilder()
    .from('hx76f46307b53686f2dd4a2c8ca2f22492e842c4bf')
    .to('hxe86b015c06145965931aff551d4958256a86226e')
    .value(IconAmount.of('0.023', IconAmount.Unit.ICX).toLoop())
    .stepLimit(IconConverter.toBigNumber(100000))
    .nid(IconConverter.toBigNumber(1))
    .version(IconConverter.toBigNumber(3))
    .timestamp(timestamp)
    .build();

// Returns raw transaction object
const rawTx = IconConverter.toRawTransaction(txObj);

// sign with address index 0
const signedTx = await ICON.signTransaction(rawTx, 0)
```

The signed transaction will be in form of `Object`, which you can use the official sdk to broadcast.
