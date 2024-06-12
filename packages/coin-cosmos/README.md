# CoolWallet EVM Compatible SDK

Typescript library with support for the integration of Cosmos SDK compatible chain for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm install @coolwallet/cosmos
```

## Usage

```javascript
import Cosmos, { CHAIN } from '@coolwallet/cosmos';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

// Select the chain
const atom = new Cosmos(CHAIN.ATOM);

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await atom.getAddress(transport, appPrivateKey, appId, addressIndex);

const transaction = {
  account_number: 0,
  sequence: 0,
  toAddress: 'recipient',
  coin: {
    denom: 'uatom',
    amount: 1,
  },
  fee: {
    denom: 'uatom',
    amount: 5000,
    gas_limit: 200000,
  },
  memo: 'Hi!',
};

const signTxData = {
  transport,
  appPrivateKey,
  appId,
  transaction,
  addressIndex,
};

const signedTx = await atom.signTransferTransaction(signTxData);
```

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/{COIN_TYPE}'/0'/0/{i} // COIN_TYPE depends on which CHAIN is used.
```

In the design of current hardware, we only support path `m/44'/{COIN_TYPE}'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

```javascript
async getAddress(
    transport: types.Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
): Promise<string>
```

#### Arguments

|      Arg      |                 Description                  |   Type    | Required |
| :-----------: | :------------------------------------------: | :-------: | :------: |
|   transport   | Object to communicate with CoolWallet device | Transport |   True   |
| appPrivateKey |  Private key for the connected application   |  string   |   True   |
|     appId     |       ID for the connected application       |  string   |   True   |
| addressIndex  |  The from address index in BIP44 derivation  |  number   |   True   |

### signTransaction

#### Description

Sign Cosmos SDK Transaction. The argument `transaction` might have different form depends on `type`.

```javascript
async signTransaction(signTxData: types.signMsg): Promise<string>
```

#### signMsg Arguments

|      Arg      |                       Description                       |    Type     | Required |
| :-----------: | :-----------------------------------------------------: | :---------: | :------: |
|   transport   |      Object to communicate with CoolWallet device       |  Transport  |   True   |
| appPrivateKey |        Private key for the connected application        |   string    |   True   |
|     appId     |            ID for the connected application             |   string    |   True   |
|  transaction  | Essential information/property for Ethereum Transaction | Transaction |   True   |
| addressIndex  |       The from address index in BIP44 derivation        |   number    |   True   |
|   publicKey   |             Public key of the from address              |   string    |   True   |
|     type      |                   Transaction type                      |   TxType    |   True   |


## Add New Chain

Let's take adding cosmos-hub(atom) for example.

1. `mkdir src/chain/atom`
2. Create `index.ts`, `token.ts`, `coin.ts` and `scripts.ts` in `src/chain/new`
3. `token.ts`:


```javascript
export const TOKENS = {};
```

4. `coin.ts`

```javascript
import { CoinProps } from '../base';

const COINS = {
  uatom: new CoinProps(
    /*denom=*/ 'uatom',
    /*symbol=*/ 'ATOM',
    /*decimal=*/ 6,
    /*signature=*/ `0030450220326DDCB119B1E35AF8544A9E8028ED082DBDED53F26F90F51BC17175E7F069C2022100B2E8C1E28CA7A407F9C724242DFE0399AAEDFCB2465EF0ADF3172BA6DDB4C6BC`
  ),
};
```

5. `scripts.ts`

```javascript
import { ScriptProps, ScriptKinds } from "../base";

const SCRIPTS: Record<ScriptKinds, ScriptProps> = {
  TRANSFER: {
    script: `CoolWallet Script`,
    signature: `CoolWallet Script Signature`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  DELEGATE: {
    script: `CoolWallet Script`,
    signature: `CoolWallet Script Signature`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  UNDELEGATE: {
    script: `CoolWallet Script`,
    signature: `CoolWallet Script Signature`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  WITHDRAW: {
    script: `CoolWallet Script`,
    signature: `CoolWallet Script Signature`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
};

export { SCRIPTS };
```


6. `index.ts`

```javascript
import { TOKENS } from './tokens';
import { COINS } from './coins';
import { SCRIPTS } from './scripts';

import { ChainProps, CoinProps } from '../base';

// Atom Chain
class Atom extends ChainProps {
  constructor() {
    super(
      /*id=*/ 'cosmoshub-4',
      /*symbol=*/ 'ATOM',
      /*coinType=*/ '80000076',
      /*prefix=*/ 'cosmos',
      /*signature=*/ `003045022100DE9CEA6458A3CBC021DBE6B9E35B796C40B1BCD574F262EE2B19A34E481AF45D02203E56C1619038268648F7CF80A349D9A27A484C02A33121B626C985775B4C92DE`,
      /*scripts=*/ SCRIPTS,
      /*coins=*/ COINS,
      /*tokens=*/ TOKENS
    );
  }

  override getNativeCoin(): CoinProps {
    return COINS.uatom;
  }
}

export default new Atom();
```

7. export `ATOM` from `src/chain/index.ts`

```javascript
export { default as ATOM } from './atom';
```

