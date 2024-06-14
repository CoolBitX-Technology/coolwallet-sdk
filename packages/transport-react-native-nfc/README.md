# transport-react-native-nfc

## Introduction
`@coolwallet/transport-react-native-nfc` is a TypeScript SDK designed to facilitate NFC (Near Field Communication) interactions, particularly for accessing and managing NFC-enabled CoolWallet Lite cards. This SDK provides functions to simplify sending APDU commands to NFC devices.

## Features
- **NFC Initialization:** Easily initialize and configure NFC communication.
- **APDU Communication:** Send APDU commands.

## Installation

To install the SDK, use npm or yarn:

```bash
npm install @coolwallet/transport-react-native-nfc
# or
yarn add @coolwallet/transport-react-native-nfc
```

## Usage

```javascript
import { NFCTransport } from '@coolwallet/transport-react-native-nfc'
import { CardType } from '@coolwallet/core/lib/transport';

const nfcTransport = new NFCTransport(CardType.Lite);

const apduCommand = '00A404000E436F6F6C57616C6C65744C495445';

nfcTransport.request(apduCommand, 'someDataPackets')
  .then((response) => {
    console.log('APDU response:', response);
  })
  .catch((error) => {
    console.error('Failed to send APDU command', error);
  });

// use transport in other package:
import CoolWallet from '@coolwallet/wallet'
const wallet = new CoolWallet(transport, appPrivateKey, appId)

```

