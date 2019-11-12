# CoolWalletS React-Native-ble Transport

If you're building a React-Native App with CoolWalletS, this is the one you need to use as `transport` in other api.

## Install

```shell
npm i @coolwallets/transport-react-native-ble
```

## Usage

```javascript
import RNBleTransport from '@coolwallets/transport-react-native-ble'
const transport =  RNBleTransport.connect(deviceOrId);

// use transport in other package:
import CoolWallet from '@coolwallets/wallet'
const wallet = new CoolWallet(transport, appPrivateKey, appId)

```
