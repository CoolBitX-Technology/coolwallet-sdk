# CoolWallet EOS App

EOS API of CoolWallet.

![version](https://img.shields.io/npm/v/@coolwallet/eos)

## Install

```shell
npm install @coolwallet/eos
```

## Usage

```javascript
import cwsEOS from '@coolwallet/eos';

const chainId = 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473';
const EOS = new cwsEOS(transport, appPrivateKey, appId, chainId);
```

The chain id is default to mainnet: `aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906`.

### Get EOS PublicKey

Before broadcasting a transaction, you may need to get the public keys from CoolWallet and use them to crate a EOS account.

```javascript
let rawPublicKey = cwsEOS.getPublicKey(0)
// 026ab43c28d98963700ee8177f3f6d4e21e1c238fcf9bfb8de992299dd309c34f1
```

You have to use [eosjs-ecc](https://github.com/EOSIO/eosjs-ecc) to convert the raw public key to the EOS-prefixed format.

```javascript
import { PublicKey } from 'eosjs-ecc'
const EOSPublicKey = await PublicKey.fromHex(rawPublicKey).toString();

console.log(EOSPublicKey)
// EOS5hUxwCqCZCLbRsKsRMng6xYgMUpCw5HKhVDEmW48nXNrCxd8Dw
```

### Sign Transaction

CoolWallet currently only support signing transaction with single eos transfer action.

```javascript

const tx = {
  expiration: 1555921263,
  ref_block_num: 25384,
  ref_block_prefix: 3136891093,
  max_net_usage_words: 0,
  max_cpu_usage_ms: 0,
  delay_sec: 0,
  data: {
    from: "coolbitxeos1",
    to: "ilovechicago",
    quantity: "0.0011 EOS",
    memo: "no memo",
  }
}


let signature = await cwsEOS.signTransaction(tx, 0)


```
