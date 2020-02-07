# CoolWalletS Bitcoin (LTC) App

![version](https://img.shields.io/npm/v/@coolwallets/btc)

## Install

```shell
npm i @coolwallets/btc
```

## Usage

```javascript
import cwsBTC from '@coolwallets/btc'

const BTC = new cwsBTC(transport, appPrivateKey, appId)

```

### getAddress

Get address by address index.

```javascript
const address = await BTC.getAddress(0)
```
