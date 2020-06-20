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

Depending on your platform, you may can choose different [transport](#Transport) object to use in you application.

### 2. Register and setup hardware wallet.

To register you application with the wallet, take a look at the [wallet module](/packages/cws-wallet). This giud you through the process of registeration and seed generation.

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

| Package                               | Version                                                    | Description                                                               |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`@coolwallet/core`](/packages/core) | ![version](https://img.shields.io/npm/v/@coolwallet/core) | APDU commands, default encryptions and keypair generation for other SDKs. |

### Base App

| Package                                       | Version                                                      | Description                                         |
| --------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| [`@coolwallet/wallet`](/packages/cws-wallet) | ![version](https://img.shields.io/npm/v/@coolwallet/wallet) | Wallet creation, device pairing and basic settings. |

### Coin Apps

Used to sign transactions of different cryptocurrencies.

| Package                                 | Version                                                   | Description              |
| --------------------------------------- | --------------------------------------------------------- | ------------------------ |
| [`@coolwallet/eth`](/packages/cws-eth) | ![version](https://img.shields.io/npm/v/@coolwallet/eth) | Ethereum Application API |
| [`@coolwallet/xrp`](/packages/cws-xrp) | ![version](https://img.shields.io/npm/v/@coolwallet/xrp) | Ripple Application API   |
| [`@coolwallet/xlm`](/packages/cws-xlm) | ![version](https://img.shields.io/npm/v/@coolwallet/xlm) | Stellar Application API  |
| [`@coolwallet/bnb`](/packages/cws-bnb) | ![version](https://img.shields.io/npm/v/@coolwallet/bnb) | Binance Application API  |
| [`@coolwallet/eos`](/packages/cws-eos) | ![version](https://img.shields.io/npm/v/@coolwallet/eos) | EOS Application API      |
| [`@coolwallet/icx`](/packages/cws-icx) | ![version](https://img.shields.io/npm/v/@coolwallet/icx) | Icon Application API     |

Other supported coins: BTC, BCH, ZEN. Open an issue if you want the sdk of any one of them to come out first.

### Other packages

| Package                                 | Version                                                   | Description              |
| --------------------------------------- | --------------------------------------------------------- | ------------------------ |
| [`@coolwallet/web3-subprovider`](/packages/web3-subprovider) | ![version](https://img.shields.io/npm/v/@coolwallet/web3-subprovider) | Web3 subprovoder that can be use with [web3-provider-engine](https://github.com/MetaMask/web3-provider-engine) |



## Examples

If you want to build your own app with this sdk, you might find the following repos useful:

- [React Example](https://github.com/antoncoding/cws-web-ble-demo) (with `web-ble`)

- [React-Native Example](https://github.com/kunmingLiu/cws-rn-ble-demo) (with `rn-ble`)

If you build something new, welcome to contact us to put your work in the list.
