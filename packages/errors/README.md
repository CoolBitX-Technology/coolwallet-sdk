# Errors

![version](https://img.shields.io/npm/v/@coolwallets/errors)

You can import our custom errors from this npm package.

## Install

```shell
npm install coolwallets@errors
```

## Usage

```javascript
import { NotRegistered } from '@coolwallets/errors'
try {
  await wallet.createWallet(12)
} catch (error) {
  if  (error instanceof NotRegistered) {
    // popup Not Register Notification
  } else {
    throw error
  }
}
```