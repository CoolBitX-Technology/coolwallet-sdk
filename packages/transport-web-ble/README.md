# CoolWalletS Web-ble Transport

If you're building a WebApp with CoolWalletS, this is the one you need to use as `transport` in other api.

## Install

```shell
npm  i @coolwallets/transport-web-ble
```

## Usage

```javascript
import WebBleTransport from '@coolwallets/transport-web-ble'
const transport = new WebBleTransport()

// use transport in other package:
import { CWSWallet } from '@coolwallets/sdk-core'
const wallet = new CWSWallet(transport, appPrivateKey, appId)

```

