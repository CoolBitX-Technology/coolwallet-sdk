# CoolWallet Stellar (XLM) App

![version](https://img.shields.io/npm/v/@coolwallet/xlm)

## Install

```shell
npm i @coolwallet/xlm
```

## Usage

```javascript
import cwsXLM from '@coolwallet/xlm'

const XLM = new cwsXLM(transport, appPrivateKey, appId)

```

### getAccount

CoolWallet currently support 2 derivation path, the default one is **SLIP0010**. Notice that you can only use **accountIndex = 0** for both derivation path for now.

```javascript
const accountIndex = 0 // any number other than 0 will cause an error.
const account = await XLM.getAccount(accountIndex)  // get SLIP0010 compatible account
console.log(account)

// GBKC7MNVXPYN75B6XB5BRBPXYXBDLKVEGJERPNQJPFOAGS2OFQICZBGG

const accountBip44 = await XLM.getAccount(accountIndex, 'BIP44');
console.log(accountBip44)
// GBE6DJHSIR6RLPCTJLIYBCA7VUOFNJ5YW6MSAOJL3QQ4E2BI3OA5EFP4
```

We call the second parameter **protocol**, which can only be either `'BIP44'` or `'SLIP0010'`. You will need to specify the protocol parameter when you're signing a transaction.

### signTransaction

We expect you to build transactions with the [official stellar sdk](https://github.com/stellar/js-stellar-sdk). You can easily use the `.signatureBase()` method to get the buffer that CoolWallet needs for signing.

```javascript
import * as Stellar from 'stellar-sdk';
const passphrase = 'Public Global Stellar Network ; September 2015';

const server = new Stellar.Server('https://horizon.stellar.org')

const fundingAccount = await server.loadAccount(account)
const operation = Stellar.Operation.payment({
  destination: 'GBE6DJHSIR6RLPCTJLIYBCA7VUOFNJ5YW6MSAOJL3QQ4E2BI3OA5EFP4',
  asset: Stellar.Asset.native(),
  amount: '1',
})

let txBuilder = new Stellar.TransactionBuilder(fundingAccount, {
  fee: 100,
  networkPassphrase: passphrase,
})
  .addOperation(operation)
  .setTimeout(Stellar.TimeoutInfinite);

let tx = txBuilder.build();
const signatureBase = tx.signatureBase(); // this is what we need.

// Sign with CoolWallet
const signature = await XLM.signTransaction(signatureBase, accountIndex)

```

### Build transaction object

In order to submit the transaction with the API package, you can use the following code to put the signature back to your tx object:

```javascript
const fundingAccount = await server.loadAccount(account)
const kp = Stellar.Keypair.fromPublicKey(fundingAccount.accountId());
const hint = kp.signatureHint(); // this value depends only on public key
const ds = new Stellar.xdr.DecoratedSignature({ hint, signature });
tx.signatures.push(ds);

// the tx object is now ready to be broadcast
await server.submitTransaction(tx);

```
