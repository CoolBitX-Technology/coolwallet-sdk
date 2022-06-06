# CoolWallet Algorand SDK

Typescript library with support for the integration of Algorand for third party application, include the functionalities of generation of addresses and signed transactions. 


## Install

```shell
npm install @coolwallet/algo
```

## Usage

```javascript
import ALGO from '@coolwallet/algo'
import { crypto } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-web-ble';

const algo = new ALGO();

const transport = await createTransport();

const { privateKey: appPrivateKey } = crypto.key.generateKeyPair();

const appId = 'appId that had been registered by wallet';

const addressIndex = 0;

const address = await algo.getAddress(transport, appPrivateKey, appId);

const enc = new TextEncoder();
const note = enc.encode("Payment Transaction");
let params = await algodClient.getTransactionParams().do();
let transactionObject = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: "PG62AH3JJUKGTMKGCHRC6RQG4WBIQGJ4ZOR4BFPHOR3VY3BK2ZLBHVEHCE",
        to: "5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U",
        amount: 100000,
        note: note,
        suggestedParams: params
      });

let transaction = transactionObject.get_obj_for_encoding();

const signTxData = {
    transport,
    appPrivateKey,
    appId,
    transaction,
    addressIndex
}

const signature = await algo.signTransaction(signTxData);
```

