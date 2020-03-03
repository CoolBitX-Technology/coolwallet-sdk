# @CoolWalletS/Wallet

This package is the starting point to interact with a CoolWalletS hardware.

## Install

```shell
npm i @coolwallets/wallet
```

## Quick Start

### 1. Keypair generation

For every APDU command, CoolWalletS will verify the identity of the requesting App by a digital signature, so we need to generate a key pair first for our new App.

You can use the `generateKeyPair()` function as follow.

```javascript
import { generateKeyPair } from '@coolwallets/wallet'
const { publicKey: appPublicKey, privateKey: appPrivateKey } = generateKeyPair()

// store it locally on web storage
localStorage.setItem('appPublicKey', appPublicKey)
localStorage.setItem('appPrivateKey', appPrivateKey)

```

### 2. Device (App) Registration

After we have our keys ready, we need to register our App so the wallet can recognize us.

This can be done by the `CoolWallet` instance. In the constructor, we need to put in a `Transport` object for bluetooth transport, and the `appPrivateKey` we just generated to sign all the commands. Here's a example how to use `web-ble-transport` with `CoolWallet`

```javascript
import WebBleTransport from '@coolwallets/transport-web-ble'
import CoolWallet from '@coolwallets/wallet'

const transport = new WebBleTransport();
const myCoolWalletS =  new CoolWallet(transport, appPrivateKey)
```

You may notice that there's one more optional field called `appId` in the constructor, we don't have it yet so we will ignore it, and we will put the value in later with `setAppId` after we get our own `appId` from `register`.

There're 3 parameters in the `register` method, `appPublicKey`, `password`and `device_name`. If this is the first app ever connect to your CoolWalletS, you can set whatever you want as password, the next app would need this password to register itself to the hardware.

*note: **The password has to be a 8 digits number string.**. The App Name can be whatever you want.

The `register()` function would return an unique `appId`, this is also something you have to save, and provide as contructor argument next time you want to create a **CoolWallet** instance as mentioned before.

```javascript
myCoolWalletS.register(appPublicKey, '12345678', 'myFirstApp')
    .then( appId =>{
        localStorage.setItem("appId", appId)
        myCoolWalletS.setAppId(appId)
        console.log(`Store AppId complete! ${appId}`)
    })
```

A registered app can also called `getPairingPassword()` to generate a new random password and revoke the old one.

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
