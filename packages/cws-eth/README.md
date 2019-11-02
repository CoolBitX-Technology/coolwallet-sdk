# CoolWalletS ETH App

Ethereum API of CoolWalletS.

## Install

```shell
npm install @coolwallets/eth
```

## Usage

```javascript
import cwsETH from '@coolwallets/eth'
const ETH = new cwsETH(transport, appPrivateKey, appId)
```

### getAddress

Get address by address index.

```javascript
const address = await ETH.getAddress(0)
```

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
```
In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

### signTransaction

Sign Ethereum Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
const payload = "eb81f884b2d05e00825208940644de2a0cf3f11ef6ad89c264585406ea346a96870107c0e2fc200080018080";
// sign with address index 0
const signedTx = await ETH.signTransaction(payload, 0)
```

### signMessage

Perform ethereum `personal_sign`.

```javascript
const message = 'custom message';
const signature = await ETH.signMessage(message, 0)

```
