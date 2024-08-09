# CoolWallet Kaspa SDK

Typescript library with support for the integration of Kaspa for third party application, include the functionalities of generation of addresses and signed transactions. 

## Install

```shell
npm i @coolwallet/kas
```

## Usage

```javascript
import KAS from '@coolwallet/kas';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const kas = new KAS();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await kas.getAddress(transport, appPrivateKey, appId, scriptType, 0);

// TODO implement
```

## Methods

### getAddress

#### Description

Get address by address index.

The KAS address generated is compatible to BIP44 and Base32 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing path:

```none
m/44'/111111'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/111111'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: Transport, 
    appPrivateKey: string, 
    appId: string, 
    scriptType: ScriptType, 
    addressIndex: number
): Promise<string> 
```

## Acknowledgements

This project includes code from the following open source projects:

- [js-wallet-sdk](https://github.com/okx/js-wallet-sdk) - Licensed under the MIT License