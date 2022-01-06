# CoolWallet Coin Tester

Testing Coin SDKs on the website

## 1. Use with Coin Template

It is good to be familiar with CoolWallet Pro by playing around this website tester and reading the source code of the coin-template sdk.

#### Install and run

```shell
npm ci
npm run dev
```

## 2. Use with Custom Coin SDK

Please add your custom coin sdk into this tester for further testing.

#### Add a custom coin sdk

add this line in the package.json and replace "custom" with the coin symbol.

```shell
"@coolwallet/coin-custom": "file:../coin-custom",
```

#### Re-install and run

```shell
npm ci
npm run dev
```
