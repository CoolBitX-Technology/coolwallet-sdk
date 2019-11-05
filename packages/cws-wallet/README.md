# @CoolWalletS/Wallet

This package is the starting point to interact with a CoolWalletS hardware.

## Install

```shell
npm i @coolwallets/wallet
```

## Quick Start

### 1. Keypair generation

For every APDU command, CoolWalletS will verify the identity of the requesting device (the App) by a digital signature, so we need to generate a key pair first for our new App.

You can use the `generateKeyPair()` function as follow.

```javascript
import { generateKeyPair } from '@coolwallets/wallet'
const { publicKey: appPublicKey, privateKey: appPrivateKey } = generateKeyPair()

// store it locally on web storage
localStorage.setItem('appPublicKey', appPublicKey)
localStorage.setItem('appPrivateKey', appPrivateKey)

```

### 2. Device (App) Registration

After we have our keys ready, we need to register our device (app) so the wallet can recognize us.

This can be done by the `CoolWallet` instance. In the constructor, we need to put in a `Transport` object for bluetooth transport, and the `appPrivateKey` we just generated to sign all the commands. Here's a example how to use `web-ble-transport` with `CoolWallet`

```javascript
import CoolWallet from '@coolwallets/wallet'
const transport = new WebBleTransport();
const myCoolWalletS =  new CoolWallet(transport, appPrivateKey)
```

You may notice that there's one more optional field called `appId` in the constructor, we don't have it yet so we will ignore it, and we will put the value in later with `setAppId` after we get our own `appId` from `register`.

```javascript
myCoolWalletS.register(appPublicKey, '123456', 'myFirstApp')
    .then( appId =>{
        localStorage.setItem("appId", appId)
        myCoolWalletS.setAppId(appId)
        console.log(`Store AppId complete! ${appId}`)
    })
```

Congrats! Now your App can communicate with the hardware wallet, If you need to pair another App with the wallet, use the **registered** credential to call `getPairingPassword()` and use it as the second parameter in `register()`.

### 3. Create a Wallet

Now the card is paired but still empty. We can use `createWallet` to securely generate a new master seed with the card, or use `setSeed` to recover one from a hex seed.

```javascript

myCoolWalletS.createWallet(12).then(_ => {
    // Sum all the seeds shown on CoolWalletS
    myCoolWalletS.sendCheckSum(873209).then( _ => {
        console.log(`Successfully create a new wallet!`)
    })
})

```

### 4. Your turn

Build your own App with our sdk!
