# CoolWalletS Javascript SDK

<p align="center"><img src="logo.jpg" width="440"/></p> <p align="center"> JavaScript SDK to communicate with CoolWalletS. </p> <p align="center">  <a href="https://opensource.org/licenses/MIT/">    
   <img src="https://img.shields.io/github/license/CoolBitX-Technology/coolwallet-js-sdk"/>  
</a></p>

This is the monorepo of all the packages you need to build your own app with CoolWalletS hardware wallet.

## Packages

### Transport

To communicate with CoolWalletS device, you need to specify a bluetooth transport.

| Package |   Version   |   Description   |
| -- | -- |--|
|[`transport-web-ble`](/packages/transport-web-ble) |  | Web Bluetooth support   |

### Core

Use this package for device registration, wallet creation, and other settings.

| Package |   Version   |   Description   |
| -- | -- |--|
|[`sdk-core`](/packages/transport-web-ble) |  | Core functionalities    |

### Coin Apps

Used to sign transactions of different cryptocurrencies.

Currently supported coins: BTC, ETH, BNB, EOS, XLM, XRP, ZEN. Open a PR if you want the sdk of any one of them to come out first.

| Package | Version | Description |
| -------- | -------- | -------- |
| [`cws-eth`](/packages/cws-eth) |   |  Ethereum Application API  |
