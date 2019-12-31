# Web3-Subprovoder


## Introduction

Create a HookedWalletSubprovider for CoolWalletS.

This provider opens up CoolWalletS Connect as a service bridge to handle transaction signing.

## Example Usage

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
}
const coolwallet = new CoolWalletSubProvider(options)

engine.addProvider(coolwallet)
engine.addProvider(new RpcSubprovider({ rpcUrl }))
engine.start()

// Use it as web3
function handleGetAccount () {
  web3.eth.getAccounts((error, accounts)=>{
    if(accounts) console.log(accounts)
    if(error) console.error(error)
  }
}

```
