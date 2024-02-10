 <!-- markdownlint-disable no-inline-html -->

# CoolWallet Javascript SDK

<p align="center">
<img src="logo.png" width="500"/>
</p>
<p align="center"> JavaScript SDK to communicate with CoolWallet.</p>
<p align="center">
<a href="https://opensource.org/licenses/apache2.0/"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
<a href="https://discordapp.com/channels/640544929680064512/660894930604130304/"><img src="https://img.shields.io/discord/640544929680064512.svg?color=768AD4&label=Discord"/></a> <a href="https://twitter.com/coolwallet"><img src="https://img.shields.io/twitter/follow/coolwallet.svg?label=CoolWallet&style=social"/></a>

</p>

This is the monorepo of all the packages you need to build your own app with CoolWallet hardware wallet.

## Quick Start

### 1. Define your [transport](#Transport) layer

Depending on your platform, you may choose different [transport](#Transport) object to use in your application.

### 2. Register and setup hardware wallet.

To register your application with the wallet, take a look at the [wallet module](/packages/core/src/apdu/wallet.ts)  in `core` package. This guide you through the process of registration and seed generation.

### 3. Build your Application

Take a look at all the supported modules at [Coin Apps](#Coin-Apps). Used the keys generated in the previous step to initiate coin instances, then you can sign transactions, message with different coin instances.

## Packages

### Transport

To communicate with CoolWallet device, you need to specify a bluetooth transport.

| Package                                                                           | Version                                                                          | Description                      |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| [`@coolwallet/transport-web-ble`](/packages/transport-web-ble)                   | ![version](https://img.shields.io/npm/v/@coolwallet/transport-web-ble)          | Web Bluetooth transport          |
| [`@coolwallet/transport-react-native-ble`](/packages/transport-react-native-ble) | ![version](https://img.shields.io/npm/v/@coolwallet/transport-react-native-ble) | React-Native Bluetooth transport |

### Core

| Package | Version | Description |
| ----- | ------------- | ------ |
| [`@coolwallet/core`](/packages/core) | ![version](https://img.shields.io/npm/v/@coolwallet/core) | APDU commands, default encryptions and keypair generation for other SDKs. |

### Coin Apps

Used to sign transactions of different cryptocurrencies.

| Package                                 | Version                                                   | Coin Name              |
| --------------------------------------- | --------------------------------------------------------- | ------------------------ |
| [`@coolwallet/atom`](/packages/cws-atom) | ![version](https://img.shields.io/npm/v/@coolwallet/atom) | Cosmos |
| [`@coolwallet/bch`](/packages/cws-bch) | ![version](https://img.shields.io/npm/v/@coolwallet/bch) | Bitcoin Cash |
| [`@coolwallet/bnb`](/packages/cws-bnb) | ![version](https://img.shields.io/npm/v/@coolwallet/bnb) | Binance |
| [`@coolwallet/bsc`](/packages/cws-bsc) | ![version](https://img.shields.io/npm/v/@coolwallet/bsc) | Binance Smart Chain |
| [`@coolwallet/btc`](/packages/cws-btc) | ![version](https://img.shields.io/npm/v/@coolwallet/btc) | Bitcoin/USDT |
| [`@coolwallet/dot`](/packages/cws-dot) | ![version](https://img.shields.io/npm/v/@coolwallet/dot) | Polkadot/Kusama |
| [`@coolwallet/eth`](/packages/cws-eth) | ![version](https://img.shields.io/npm/v/@coolwallet/eth) | Ethereum (Ether, ERC20, Smart Contract, EIP-1559 etc.)|
| [`@coolwallet/icx`](/packages/cws-icx) | ![version](https://img.shields.io/npm/v/@coolwallet/icx) | Icon |
| [`@coolwallet/ltc`](/packages/cws-ltc) | ![version](https://img.shields.io/npm/v/@coolwallet/ltc) | LiteCoin |
| [`@coolwallet/trx`](/packages/cws-trx) | ![version](https://img.shields.io/npm/v/@coolwallet/trx) | Tron |
| [`@coolwallet/xlm`](/packages/cws-xlm) | ![version](https://img.shields.io/npm/v/@coolwallet/xlm) | Stellar/Kinesis |
| [`@coolwallet/xrp`](/packages/cws-xrp) | ![version](https://img.shields.io/npm/v/@coolwallet/xrp) | Ripple |
| [`@coolwallet/zen`](/packages/cws-zen) | ![version](https://img.shields.io/npm/v/@coolwallet/zen) | Zen Cash |


## Examples: Build ETH in web app
### To connect to CoolWallet Pro via BLE


```
npm install @coolwallet/core
npm install @coolwallet/transport-web-ble
```

```javascript
import WebBleTransport from "@coolwallet/transport-web-ble";
import * as core from "@coolwallet/core";
```

Create a connection to obtain the Card Name and SE Public Key.

```javascript

connect = async () => {
WebBleTransport.listen(async (error, device) => {
    const cardName = device.name;
    const transport = await WebBleTransport.connect(device);
    const SEPublicKey = await core.config.getSEPublicKey(transport)
    this.setState({ transport, cardName, SEPublicKey });
    localStorage.setItem('cardName', cardName)
    localStorage.setItem('SEPublicKey', SEPublicKey)
  });
};

disconnect = () => {
  WebBleTransport.disconnect(this.state.transport.device.id);
  this.setState({ transport: undefined, cardName: "" });
};

```

- transport: The object used to communicate with CoolWallet
- SEPublicKey: The key used to authenticate SE.


### Register application with CoolWallet Pro

Obtain app key pairs.

```javascript
const keyPair = crypto.key.generateKeyPair()
localStorage.setItem('appPublicKey', keyPair.publicKey)
localStorage.setItem('appPrivateKey', keyPair.privateKey)
```

- keyPair: The keys use to check your app.

Register card and obtain the appId.

```javascript
const name = 'your app name'
const SEPublicKey = localStorage.getItem('SEPublicKey')
const appId = await apdu.pair.register(transport, appPublicKey, password, name, SEPublicKey);
```

- password: Pairing password for the app to establish the connection with CoolWallet Pro. The password could be supplied by the user (max length: 8).

NOTE: A single CoolWallet Pro could only be paired to 3 apps.


### Create / Recover the wallet

Use function `setSeed` to create or recover your wallet.

```javascript
const seedHex = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
await apdu.wallet.setSeed(transport, appId, appPrivateKey, seedHex, SEPublicKey)

```

If you want to create seed by card, you can use function `createSeedByCard`. And also choose the length of seed(12, 18, 24).

```javascript
await apdu.wallet.createSeedByCard(transport, appId, appPrivateKey, 12);
```


### Use coin app

```
npm install @coolwallet/eth
```

```javascript
import cwsETH from '@coolwallet/eth'

const ETH = new cwsETH();
```

### Get Address

```javascript
const address = await ETH.getAddress(
  transport,
  appPrivateKey,
  appId,
  addressIdx
); 

```

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress(i)` will get the address of following BIP44 path:

```none
m/44'/60'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

If you have `accountPublicKey` and `accountChainCode`, you can use the function `ETH.getAddressByAccountKey()` to get the address. 
```javascript
const address = await ETH.getAddressByAccountKey(
  accountPublicKey,
  accountChainCode,
  addressIndex
);
```

### Sign Transaction

The signedTx is signed by CoolWallet, which can be sent directly.

```javascript
const transaction = {
    nonce: "0x21d",
    gasPrice: "0x59682f00",
    gasLimit: "0x5208",
    to: "0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C",
    value: "0x5af3107a4000",
    data: "0x00",
    chainId: 1
};
const signTxData = {
  transport,
  appPrivateKey,
  appId,
  transaction,
  addressIndex,
};

const signedTx = await ETH.signTransaction(signTxData);

```

## Scripts

- `bootstrap`: Initialize monorepo environment with lerna.
- `build`: Build all packages.
- `clean`: Remove all packages's node_modules.
- `ci`: Script for CI.
- `update:lock`: Update package-lock.json information.

## Contributing

If you're interested to develop new coin for CoolWallet Pro, please see [CONTRIBUTING](./CONTRIBUTING.md) for more information.
