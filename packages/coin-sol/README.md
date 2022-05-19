# CoolWallet Solana (SOL) SDK

[![Version](https://img.shields.io/npm/v/@coolwallet/sol)](https://www.npmjs.com/package/@coolwallet/sol)

Typescript library with support for the integration of Solana for third party application, include the functionalities of generation of addresses and signed transactions.

## Install

```shell
npm i @coolwallet/sol
```

## Usage

Normal transfer case, with sol token (native token on Solana)

```javascript
import SOL from '@coolwallet/sol';
import { Connection, PublicKey, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/web3.js';
import base58 from 'bs58';

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const address = await sol.getAddress(transport, appPrivateKey, appId, 0);
const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

const sol = new SOL();

const toPubkey = 'destination address';
const amount = 0.000001; // transfer amount

const transaction = {
  toPubkey,
  recentBlockhash,
  amount,
};

const appId = localStorage.getItem('appId');
if (!appId) throw new Error('No Appid stored, please register!');
const signedTx = await sol.signTransaction({
  transport,
  appPrivateKey,
  appId,
  transaction,
});
const recoveredTx = Transaction.from(signedTx);

const verifySig = recoveredTx.verifySignatures();

// signature need to be valid
if (!verifySig) throw new Error('Fail to verify signature');

return connection.sendRawTransaction(recoveredTx.serialize());
```

Other case we have similar workflow but using different input, following below:

```javascript
// transfer spl token
const tokenInfo = {
  symbol: TOKEN_NAME,
  address: TOKEN_ADDRESS,
  decimals: TOKEN_DECIMALS,
};

const tx = {
  walletAddress,
  fromTokenAccount,
  toTokenAccount,
  recentBlockhash,
  amount: 0.1,
  tokenInfo,
};

// Get associateAccount address.
const [associateAccount] = await PublicKey.findProgramAddress(
  [base58.decode(address), TOKEN_PROGRAM_ID.toBuffer(), base58.decode(tokenInfo.address)],
  ASSOCIATED_TOKEN_PROGRAM_ID
);

// create associate token account
const tx = {
  owner: address,
  associateAccount,
  recentBlockhash,
  token: tokenInfo.address,
};
```

In construct, you can choose the chain you want to implement.

## Methods

### getAddress

#### Description

The address generated is compatible to BIP44 with **account** 0 by following BIP44 path:

```none
m/44'/501'/0'
```

```javascript
async getAddress(
    transport: Transport,
    appPrivateKey: string,
    appId: string
): Promise<string>
```

#### Arguments

|      Arg      |                 Description                  |   Type    | Required |
| :-----------: | :------------------------------------------: | :-------: | :------: |
|   transport   | Object to communicate with CoolWallet device | Transport |   TRUE   |
| appPrivateKey |  Private key for the connected application   |  string   |   TRUE   |
|     appId     |       ID for the connected application       |  string   |   TRUE   |

### signTransaction

#### Description

You can use either solana **Transaction** object to form a transaction with user input and run `compileMessage()` function to extract needed input for signing process or you can use our `TransactionCreator` class to generate automatically transaction instruction.

```javascript
async signTransaction(signTxData: signTxType):Promise<string>
```

#### signTxType Arguments

|      Arg      |                             Description                              |   Type    | Required |
| :-----------: | :------------------------------------------------------------------: | :-------: | :------: |
|   transport   |             Object to communicate with CoolWallet device             | Transport |   TRUE   |
| appPrivateKey |              Private key for the connected application               |  string   |   TRUE   |
|     appId     |                   ID for the connected application                   |  string   |   TRUE   |
|  transaction  |          Essential information/property for XLM Transaction          |  Object   |   TRUE   |
|   confirmCB   |      Callback of confirmation data to the connected application      | Function  |  FALSE   |
| authorizedCB  | Callback of authorized transaction data to the connected application | Function  |  FALSE   |

If you don't want to use solana web3 js to extract needed input, use can pass in manually instructions data for transaction by yourself, following by this logic:

```javascript
// user defined instruction
// associateProgramAccount is associate account with your account used for storing
// data of interacting process with solana smart contract (or user defined program).
const tx = {
  instructions: [
    {
      accounts: [{ pubkey: associateProgramAccount, isSigner: false, isWritable: true }],
      programId: programId,
      data: data,
    },
  ],
  recentBlockhash,
  feePayer: signer,
};

const signedTx = await sol.signTransaction({
  transport,
  appPrivateKey,
  appId,
  transaction,
});

const recoveredTx = Transaction.from(signedTx);

const verifySig = recoveredTx.verifySignatures();

// signature need to be valid
if (!verifySig) throw new Error('Fail to verify signature');

return connection.sendRawTransaction(recoveredTx.serialize());
```
