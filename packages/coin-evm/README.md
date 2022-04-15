# CoolWallet EVM Compatible SDK

Typescript library with support for the integration of EVM compatible chain for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm install @coolwallet/evm
```

## Usage

```javascript
import EVM, { CHAIN } from '@coolwallet/EVM';
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

// Select the chain
const cronos = new EVM(CHAIN.CRONOS);

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await cronos.getAddress(transport, appPrivateKey, appId, addressIndex);

const transaction = {
  nonce: '0x21d',
  gasPrice: '0x59682f00',
  gasLimit: '0x5208',
  to: '0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C',
  value: '0x5af3107a4000',
  data: '0x00',
  chainId: 1,
};

const signTxData = {
  transport,
  appPrivateKey,
  appId,
  transaction,
  addressIndex,
};

const normalTx = await cronos.signTransaction(signTxData);

const signTxData = {
  transport,
  appPrivateKey,
  appId,
  transaction,
  addressIndex,
};

const erc20Transaction = {
  nonce: '0x85',
  gasPrice: '0x23a427985a',
  gasLimit: '0x72c2',
  to: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  value: '0x0',
  data: '0x00',
  chainId: 1,
  option: {
    symbol: 'USDT',
    unit: '6',
  },
};

const erc20SignTxData = {
  transport,
  appPrivateKey,
  appId,
  transaction: erc20Transaction,
  addressIndex,
};

const erc20Tx = await cronos.signERC20Transaction(erc20SignTxData);
```

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** and **change** set to 0, which means calling `getAddress` with `addressIndex = i` will get the address of folllowing BIP44 path:

```none
m/44'/60'/0'/0/{i}
```

In the design of current hardware, we only support path `m/44'/60'/0'/0/{i}` for speed optimization. This might change in the future and we will then open a more general interface to deal with custom path.

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

Sign Ethereum Transaction. If the transaction has non-empty `data` field, the card will display `SMART` instead of transfering amount.

```javascript
async signTransaction(signTxData: types.signTx): Promise<string>
```

#### signTx Arguments

|      Arg      |                       Description                       |    Type     | Required |
| :-----------: | :-----------------------------------------------------: | :---------: | :------: |
|   transport   |      Object to communicate with CoolWallet device       |  Transport  |   True   |
| appPrivateKey |        Private key for the connected application        |   string    |   True   |
|     appId     |            ID for the connected application             |   string    |   True   |
|  transaction  | Essential information/property for Ethereum Transaction | Transaction |   True   |
| addressIndex  |       The from address index in BIP44 derivation        |   number    |   True   |
|   publicKey   |             Public key of the from address              |   string    |   True   |

### signMessage

#### Description

Perform ethereum `personal_sign`.

```javascript
async signMessage(signMsgData: types.signMsg): Promise<string>

```

#### signMsg Arguments

|      Arg      |                 Description                  |   Type    | Required |
| :-----------: | :------------------------------------------: | :-------: | :------: |
|   transport   | Object to communicate with CoolWallet device | Transport |   True   |
| appPrivateKey |  Private key for the connected application   |  string   |   True   |
|     appId     |       ID for the connected application       |  string   |   True   |
|    message    |               Message to sign                |  string   |   True   |
| addressIndex  |  The from address index in BIP44 derivation  |  number   |   True   |

### signTypedData

#### Description

Perform ethereum `sign_typed_data`.

```javascript
async signTypedData(typedData: types.signTyped): Promise<string>
```

#### signTyped Arguments

|      Arg      |                 Description                  |   Type    | Required |
| :-----------: | :------------------------------------------: | :-------: | :------: |
|   transport   | Object to communicate with CoolWallet device | Transport |   True   |
| appPrivateKey |  Private key for the connected application   |  string   |   True   |
|     appId     |       ID for the connected application       |  string   |   True   |
|   typedData   |      Typed structured data to be signed      |    any    |   True   |
| addressIndex  |  The from address index in BIP44 derivation  |  number   |   True   |


## Add New Chain

1. `mkdir src/chain/new`
2. Create index.ts and token.ts in `src/chain/new`
3. `token.ts`:

```javascript
export const TOKENS = {};
```

4. `index.ts`:

```javascript
import { TOKENS } from './token';
import { ChainProps } from '../types';

class NewChain extends ChainProps {
  id = NewChainId as number;
  symbol = 'NewChainSymbol';
  signature = '';
  tokens = TOKENS;
}

export default new NewChain();
```

5. export `NewChain` from `src/chain/index.ts`

```javascript
export { default as NEW } from './new';
```

6. Add `NewChain` to `tools/chain` to generate encoded data which should be signed.

```javascript
console.log('New Chain Information', CHAIN.NEW.toHexChainInfo());
```