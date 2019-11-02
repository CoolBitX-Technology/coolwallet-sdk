# SDK-Core

This package handles the apdu request for a CoolWalletS, also export a couple of classes to easily get started with CoolWalletS.

Use `CWSDevice` to register your current device, reset wallet or tune other settings.

Use `CWSWallet` to create or recover wallet in CoolWalletS.

## Install

```shell
npm i @coolwallets/sdk-core
```

## Quick Start

### 1. Keypair generation

For every APDU command, CoolWalletS will verify the identity of the requesting device (the App) by a digital signature, so we need to generate a key pair first for a new App.

```javascript
import { generateKeyPair } from '@coolwallets/sdk-core'
const { publicKey: appPublicKey, privateKey: appPrivateKey } = generateKeyPair()

// store it locally on web storage
localStorage.setItem('appPublicKey', appPublicKey)
localStorage.setItem('appPrivateKey', appPrivateKey)

```

### 2. Device (App) Registration

After we have our keys ready, we need to register our device (app) so the wallet can recognize us.

This can be done by the `CWSDevice` instance. In the constructor, we need to put in a `Transport` object for bluetooth transport, and the `appPrivateKey` we just generated to sign all the commands. Here's a example how to use `web-ble-transport` with `CWSDevice`

```javascript
const transport = new WebBleTransport();
const device =  new CWSDevice(transport, appPrivateKey)
```

You may notice that there's one more optional field called `appId` in the constructor, we don't have it yet so we will ignore it, and we will put the value in later with `setAppId` after we get our own `appId` from `register`.

```javascript
device.register(appPublicKey, '123456', 'myFirstApp')
    .then( appId =>{
        localStorage.setItem("appId", appId)
        device.setAppId(appId)
        console.log(`Store AppId complete! ${appId}`)
    })
```

Congrats! Now your App can communicate with the hardware wallet,  If you need to pair another App with the wallet, use a **registered** App to call `device.getPairingPassword()` and use it as the second parameter in `register()`

### 3. Wallet Creation

You can use `createWallet` to securely generate a new master seed with the card, or use `setSeed` to recover one from a hex seed.

```javascript
import { CWSWallet } from '@coolwallets/sdk-core'
const wallet = new CWSWallet(transport, appPrivateKey, appId)

wallet.createWallet(12).then(_ => {
    // Sum all the seeds shown on CoolWalletS
    wallet.sendCheckSum(873209).then( _ => {
        console.log(`Successfully create a new wallet!`)
    })
})

```

### 4. Your turn

Build your own App with our sdk!
