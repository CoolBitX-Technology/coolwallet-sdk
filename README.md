 <!-- markdownlint-disable no-inline-html -->

# CoolWalletS Javascript SDK


<p align="center">
<img src="logo.png" width="500"/>
</p>
<p align="center"> JavaScript SDK to communicate with CoolWalletS.</p>
<p align="center">
<a href="https://opensource.org/licenses/apache2.0/"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
<a href="https://discordapp.com/channels/640544929680064512/660894930604130304/"><img src="https://img.shields.io/discord/640544929680064512.svg?color=768AD4&label=Discord"/></a> <a href="https://twitter.com/coolwallet"><img src="https://img.shields.io/twitter/follow/coolwallet.svg?label=CoolWallet&style=social"/></a>

</p>


This is the monorepo of all the packages you need to build your own app with CoolWalletS hardware wallet.

## Packages

### Transport

To communicate with CoolWalletS device, you need to specify a bluetooth transport.

| Package                                                                           | Version                                                                          | Description                      |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| [`@coolwallets/transport-web-ble`](/packages/transport-web-ble)                   | ![version](https://img.shields.io/npm/v/@coolwallets/transport-web-ble)          | Web Bluetooth transport          |
| [`@coolwallets/transport-react-native-ble`](/packages/transport-react-native-ble) | ![version](https://img.shields.io/npm/v/@coolwallets/transport-react-native-ble) | React-Native Bluetooth transport |

### Core

| Package                               | Version                                                    | Description                                                               |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`@coolwallets/core`](/packages/core) | ![version](https://img.shields.io/npm/v/@coolwallets/core) | APDU commands, default encryptions and keypair generation for other SDKs. |

### Base App

| Package                                   | Version                                                      | Description |
| ----------------------------------------- | ------------------------------------------------------------ | ----------- |
| [`@coolwallets/errors`](/packages/errors) | ![version](https://img.shields.io/npm/v/@coolwallets/errors) | Errors      |
| [`@coolwallets/wallet`](/packages/cws-wallet) | ![version](https://img.shields.io/npm/v/@coolwallets/wallet) | Wallet creation, device pairing and basic settings. |

### Coin Apps

Used to sign transactions of different cryptocurrencies.

| Package                                 | Version                                                   | Description              |
| --------------------------------------- | --------------------------------------------------------- | ------------------------ |
| [`@coolwallets/eth`](/packages/cws-eth) | ![version](https://img.shields.io/npm/v/@coolwallets/eth) | Ethereum Application API |
| [`@coolwallets/xrp`](/packages/cws-xrp) | ![version](https://img.shields.io/npm/v/@coolwallets/xrp) | Ripple Application API |
| [`@coolwallets/xlm`](/packages/cws-xlm) | ![version](https://img.shields.io/npm/v/@coolwallets/xlm) | Stellar Application API |
| [`@coolwallets/bnb`](/packages/cws-bnb) | ![version](https://img.shields.io/npm/v/@coolwallets/bnb) | Binance Application API |
| [`@coolwallets/eos`](/packages/cws-eos) | ![version](https://img.shields.io/npm/v/@coolwallets/eos) | EOS Application API |
| [`@coolwallets/icx`](/packages/cws-icx) | ![version](https://img.shields.io/npm/v/@coolwallets/icx) | Icon Application API |

Other supported coins: BTC, BCH, ZEN. Open an issue if you want the sdk of any one of them to come out first.

## Examples

If you want to build your own app with this sdk, you might find the following repos useful:

- [React Example](https://github.com/antoncoding/cws-web-ble-demo) (with `web-ble`)

- [React-Native Example](https://github.com/kunmingLiu/cws-rn-ble-demo) (with `rn-ble`)

If you build something new, welcome to contact us to put your work in the list.
