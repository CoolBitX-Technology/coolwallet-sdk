# CoolWallet Coin Tester

Testing Coin SDKs on the website

## Compatibility

- node 14+
- npm 7+

## Use with Coin Template

It would be beneficial to be familiar with CoolWallet Pro by playing around with this website tester and reading the source code of the coin-template sdk.

#### Install and run

```shell
cd ./packages/core
npm ci
npm run build

cd ../transport-web-ble
npm ci
npm run build

cd ../coin-template
npm ci
npm run build

cd ../coin-tester
npm ci
npm run dev
```

## Use with Custom Coin SDK

Please add your custom coin sdk into this tester for further testing.

#### Add a custom coin sdk

a. add this line in the package.json and replace **`custom`** with the coin symbol.

```shell
"@coolwallet/coin-custom": "file:../coin-custom",
```

b. develop your custom coin page in the `src/components/coins/custom/`

c. export it in the `src/components/coins/index.ts`

```shell
import template from './template';
import custom from './custom';

export default [
  { path: 'template', Element: template },
  { path: 'custom', Element: custom },
];
```

#### Re-install and run

```shell
npm ci
npm run dev
```
