# CoolWallet Web-ble Transport

If you're building a WebApp with CoolWallet, this is the one you need to use as `transport` in other api.

## Install

```shell
npm i @coolwallet/transport-web-ble
```

## Usage

```javascript
import cwsETH from '@coolwallet/eth';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const transport = await createTransport();
const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const ETH = new cwsETH();
// use transport in other package
const address = await ETH.getAddress(transport, appPrivateKey, appId, 0);
```

## API

### createTransport

A convenient way to create internal transport.

```javascript
const createTransport: () => Promise<Transport>
```

### WebBleManager

Manage browser bluetooth status.

#### isSupported

Check whether browser support [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility).  

```javascript
async isSupported(): Promise<boolean>
```

#### listen

Popup browser bluetooth selector.
Return the selected `BluetoothDevice`.

```javascript
async listen(): Promise<BluetoothDevice>
```

#### connect

Connected to the given `BluetoothDevice` and create `transport`.

```javascript
async connect(device: BluetoothDevice): Promise<Transport>
```

#### disconnect

Disconnect from the `BluetoothRemoteGATTServer` and remove `transport`.

```javascript
async disconnect(): Promise<void>
```
