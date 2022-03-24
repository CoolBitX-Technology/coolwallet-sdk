# CoolWallet Coin Tester

Testing Coin SDKs on the website

## Compatibility

- node 14+
- npm 7+

## Initialize with Coin Template

It would be beneficial to be familiar with CoolWallet Pro by playing around with this website tester and reading the source code of the coin-template sdk.

#### Install

```shell
npm install
```

#### Generate Coin Config

```shell
echo '[\n  "@coolwallet/template"\n]' > coin.config.json
```

#### Build

```shell
npm run bootstrap
```
This command would ask you which packages should be built.

Choose the first one - `Build both mandatory library and coin packages`.

#### Run

```shell
npm run dev
```

## Add a Custom Coin SDK

Please add your custom coin sdk into this tester for further testing.

#### Add a custom coin sdk into coin-tester for demonstration

a. Add this line in the package.json and replace **`custom`** with the coin symbol.

```shell
"@coolwallet/custom": "file:../coin-custom",
```

b. Develop your custom coin page in the `src/components/coins/custom/`

c. Export it in the `src/components/coins/index.ts`

```shell
import TEMPLATE from './template';
import CUSTOM from './custom';

export default [
  { path: 'template', Element: TEMPLATE },
  { path: 'custom', Element: CUSTOM },
];
```

#### Build a custom coin sdk

a. Add the custom coin package name to `coin.config.json` file.

```shell
[
  "@coolwallet/template",
  "@coolwallet/custom"
]
```

b. Re-build

```shell
npm run bootstrap
```
This time choose `Build coin packages which specific in coin.config.json`.

It will only build coin sdk listed in the `coin.config.json`.

#### Clean cache and Run

```shell
npm run dev -- --force
```
