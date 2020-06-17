# CoolWallet Ripple (XRP) App

![version](https://img.shields.io/npm/v/@coolwallet/xrp)

## Install

```shell
npm i @coolwallet/xrp
```

## Usage

```javascript
import cwsXRP from '@coolwallet/xrp'

const XRP = new cwsXRP(transport, appPrivateKey, appId)

```

### getAddress

Get address by address index.

```javascript
const address = await XRP.getAddress(0)
// rEoA7FTruU4SMdG99yuuUbUPxp1bh9aZjR
```

### signPayment

CoolWallet only support singing basic transaction type **Payment**.

The field `TransactionType` must be `Payment`, and the `Flags` must be set to 2147483648.

```javascript

const payment = {
  // fixed fields
  TransactionType: "Payment",
  Flags: 2147483648,
  // Other fields
  Sequence: 1566719,
  DestinationTag: 1882298635,
  LastLedgerSequence: 47914574,
  Amount: "100000", // in drops
  Fee: "1000",      // in drops
  SigningPubKey: "027f033c29de4bc02096492da93e00d55d2851f74dc0b5ab58c9b83b3e8067b4af", // optional
  Account: "rEoA7FTruU4SMdG99yuuUbUPxp1bh9aZjR",
  Destination: "rp6ENYKqYfT5qJqQiN2Y9AnZmFEWv9hRpq"
}
```

You might already know the public key of the source account (by calling `.getPublicKey()` before ). if that's the case, put it in the Payment object as `SigningPubKey`. Otherwise we would need another bluetooth command to derive the key again.
