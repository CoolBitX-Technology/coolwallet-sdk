# CoolWallet Bitcoin (LTC) App

![version](https://img.shields.io/npm/v/@coolwallet/btc)

## Install

```shell
npm i @coolwallet/btc
```

## Usage

```javascript
import cwsBTC from '@coolwallet/btc'

const BTC = new cwsBTC(transport, appPrivateKey, appId)

```

### getAddress

Get address by address index.

```javascript
const address = await BTC.getAddress(0)
```
