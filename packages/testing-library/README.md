## CoolWallet Testing Library

Testing library for CoolWallet SDKs.

### API

#### `initialize(transport: Transport, mnemonic: string)`

Type: `Function`

Reset card, register with new appId and create wallet with given mnemonic.

#### `getTxDetail(transport: Transport, appId: string)`

Type: `Function`

Get CoolWallet display transaction information even if condition is not satisfy.

#### `DisplayBuilder`

Type: `class`

A Friendly utilities to build CoolWallet display transaction information.

#### `Wallet`

Type: `class`

A Hierarchical Deterministic Wallet which support both SLIP-0010 and BIP-0032.