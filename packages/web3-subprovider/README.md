# Web3-Subprovoder

## Introduction

Create a HookedWalletSubprovider for CoolWalletS.

This provider opens up CoolWalletS Connect as a service bridge to handle transaction signing.

## Example Usage

### Start Web3

```javascript

// Starting web3 engine with CoolWallet Subprovider
import Web3 from 'web3'
import CoolWalletSubProvider from '@coolwallets/web3-subprovider'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'

const engine = new ProviderEngine()
const rpcUrl = 'https://mainnet.infura.io/v3/{your token}'

const options = {
  accountsLength: 5,
  accountsOffset: 0,
  networkId: 1
}
const coolwallet = new CoolWalletSubProvider(options)

engine.addProvider(coolwallet)
engine.addProvider(new RpcSubprovider({ rpcUrl }))
engine.start()

const web3 = new Web3(engine);
```

### Usage

```javascript

// Use it as web3
function handleGetAccount () {
  web3.eth.getAccounts((error, accounts)=>{
    if(accounts) console.log(accounts)
    if(error) console.error(error)
  }
}

// Sign Transaction

function handleSignTransaction () {
  const tx = {
    "from": from,
    "nonce": "0x3b",
    "gasPrice": "0xe8754700",
    "gasLimit": "0x520c",
    "to": "0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C",
    "value": "0x2386f26fc10000",
  }
  web3.eth.signTransaction(tx,(error, signed)=>{
    if(signed) {
      web3.eth.sendSignedTransaction(signed.raw, (err, hash)=>{
        if(hash) console.log(`tx hash: ${hash}`)
      })
    }
  })
}
```
