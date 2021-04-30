# CoolWallet React-Native-ble Transport

If you're building a React-Native App with CoolWallet, this is the one you need to use as `transport` in other api.

## Install

```shell
npm i @coolwallet/transport-react-native-ble
```

## Usage

```javascript
import RNBleTransport from '@coolwallet/transport-react-native-ble'
const transport =  RNBleTransport.connect(deviceOrId);

// use transport in other package:
import CoolWallet from '@coolwallet/wallet'
const wallet = new CoolWallet(transport, appPrivateKey, appId)

```
