# CoolWalletS Javascript SDK

<p align="center"><img src="logo.png" width="500"/></p> <p align="center"> JavaScript SDK to communicate with CoolWalletS. </p> <p align="center">  <a href="https://opensource.org/licenses/MIT/">    
   <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/>  
</a></p>

This is the monorepo of all the packages you need to build your own app with CoolWalletS hardware wallet.

## Packages

### Transport

To communicate with CoolWalletS device, you need to specify a bluetooth transport.

| Package                                                         | Version                                                                 | Description           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------- |
| [`@coolwallets/transport-web-ble`](/packages/transport-web-ble) | ![version](https://img.shields.io/npm/v/@coolwallets/transport-web-ble) | Web Bluetooth transport |
| [`@coolwallets/transport-react-native-ble`](/packages/transport-react-native-ble) | ![version](https://img.shields.io/npm/v/@coolwallets/transport-react-native-ble) | React-Native Bluetooth transport |
### Core

| Package                                   | Version                                                    | Description          |
| ----------------------------------------- | ---------------------------------------------------------- | -------------------- |
| [`@coolwallets/core`](/packages/core) | ![version](https://img.shields.io/npm/v/@coolwallets/core) | APDU commands, default encryptions and keypair generation for other SDKs. |

### Base App

| Package                                   | Version                                                    | Description          |
| ----------------------------------------- | ---------------------------------------------------------- | -------------------- |
| [`@coolwallets/wallet`](/packages/cws-wallet) | ![version](https://img.shields.io/npm/v/@coolwallets/wallet) | Wallet creation, device pairing and basic settings. |

### Coin Apps

Used to sign transactions of different cryptocurrencies.

Currently supported coins: BTC, ETH, BNB, EOS, XLM, XRP, ZEN. Open an issue if you want the sdk of any one of them to come out first.

| Package                                 | Version                                                   | Description              |
| --------------------------------------- | --------------------------------------------------------- | ------------------------ |
| [`@coolwallets/eth`](/packages/cws-eth) | ![version](https://img.shields.io/npm/v/@coolwallets/eth) | Ethereum Application API |

## Examples

If you want to build your own app with this sdk, you might find the following repository useful:

* [React Example](https://github.com/antoncoding/cws-web-ble-demo) (with `web-ble`)

* [React-Native Example](https://github.com/kunmingLiu/cws-rn-ble-demo) (with `rn-ble`)