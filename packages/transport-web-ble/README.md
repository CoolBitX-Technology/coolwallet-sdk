# CoolWallet Web-ble Transport

If you're building a WebApp with CoolWallet, this is the one you need to use as `transport` in other api.

## Install

```shell
npm i @coolwallet/transport-web-ble
```

## Usage

The `listen()` method takes in an callback function to handle bluetooth scanning.
In web-ble, this is when the popup show and the user select the device to pair, so the returned `device` is only one selected device.

```javascript
import WebBleTransport from '@coolwallet/transport-web-ble'
await WebBleTransport.listen(async (error, device) => { // browser shows popup
  if (device) {
    const transport = await WebBleTransport.connect(device)
    /**
     * Do something with transport
     **/
  } else throw error
})

// use transport in other package:
import CoolWallet from '@coolwallet/wallet'
const wallet = new CoolWallet(transport, appPrivateKey, appId)
```
