### Abstract

This document will guide you how to integrate new crypto currency into CoolWallet Pro, starting from signing script to SDK development.

### Introduction

In order to facilitate new crypto currency integration, we have designed a new script language that allows developers to write a script to compose signature generation. The script could accept arguments to generate the signature.
CoolWallet Pro involves complex Application Protocol Data Unit (APDU) commands, and deals with various cryptographic algorithms for security consideration. To facilitate the development experience, we wrap the communication protocol as a core package in the SDK, so developers just need to focus on developing the logic of new crypto currency.

### What is Signing Script 

As mentioned above, the signing script is a script language developed for CoolWallet Pro to process and compose the signatures for later broadcasting transactions to blockchain. We provide a separate tool in this [repository](https://github.com/CoolBitX-Technology/coolwallet-signing-tools/tree/dev) and please refer to it for more information.
### What is CoolWallet SDK

CoolWallet SDK is a set of tools for app developers to easily communicate with CoolWallet Pro for key management and signature generation. The SDK itself supports more than 10 crypto currencies (and the number is increasing), and it also encapsulates all the communication commands required with CoolWallet Pro.

The relationship between CoolWallet Pro and CoolWallet SDK is shown in the figure below：

![](./pics/architecture.png)

CoolWallet SDK is designed to incorporate community support. We welcome community effort to help add more crypto currencies in the SDK. In the following paragraphs we will provide more detail about how to contribute to CoolWallet SDK.

### Prerequisite

* Favorite IDE that supports TypeScript
* PC/notebook with bluetooth connectivity
* CoolWallet Pro
* Blockchain API of the crypto currency you want to develop
	* CoolWallet SDK does not handle transaction broadcasting to blockchain. To test the correctness of the signature, you may need to have API access to actually broadcast the transaction.
* Signing script

### Steps

* Create a package for the crypto currency
	* Folder name should follow the rule: coin-(simbol)
	<img src="./pics/folder.png" alt="drawing" width="150"/>
* According to the currency nature, you may need to implement ECDSA or EDDSA class and required functions, getAddress(), and signTransaction().

example : [index.ts](./packages/coin-xrp/src/index.ts) 

```javascript
export default class XRP extends COIN.ECDSACoin implements COIN.Coin{
```

**getAddress**
	
```javascript
 async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.pubKeyToAddress(publicKey);
  }
```

 **signTransaction**, include signing script
	
```javascript
 async signTransaction(
    signTxData: types.signTxType
  ) {
    const payment = signTxData.payment;

    payment.TransactionType = "Payment";
    payment.Flags = 2147483648;
    if (!payment.SigningPubKey) {
      payment.SigningPubKey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.addressIndex);
      payment.SigningPubKey = payment.SigningPubKey.toUpperCase();
    }
    if (!payment.Account) {
      payment.Account = txUtil.pubKeyToAddress(payment.SigningPubKey);
    }

    return xrpSign.signPayment(
      signTxData,
      payment,
    );
  }
```
* If the currency has extra functionalities, like smart contracts, staking, etc. You may need to implement additional functions as well.
* Once you finish the development of new crypto currency, you may want to test the functionalities. Here are some suggested test cases.
	* Check the address created by getAddress() function and compare it with official tools (CLI, or API).
	* When performing the signature generation, make sure the information shown on CoolWallet Pro is correct. The information includes the blockchain symbol,token name (if it is a token transaction), addresses, and amount.
	* Finally check if the transaction (combined with generated signature) could be broadcasted to the blockchain successfully.
* If everything goes well, you’re encouraged to create a pull request to the repository. CoolBitX engineering team will help to review it.