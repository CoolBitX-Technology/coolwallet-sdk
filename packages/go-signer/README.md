# CoolWallet Go Signer

Blind signing API for CoolWallet Go cards running the signing-only firmware (SE version >= 100).

The card no longer parses transactions. The app builds and hashes the transaction, and the card only signs what it receives. **There is no on-card confirmation: anything passed in gets signed.**

## Install

```shell
npm install @coolwallet/core @coolwallet/go-signer
```

`@coolwallet/go-signer` depends on `@coolwallet/core` `^2.1.0-beta.0`, the first version with `coin.signData`. Keep the app's own core in the same range so npm installs a single copy shared by both.

## Usage

```javascript
import { utils, config } from '@coolwallet/core';
import GoSigner from '@coolwallet/go-signer';

const signer = new GoSigner(transport, { appId, appPrivateKey });

// Throws if the SE version cannot be read, so a dropped connection is not mistaken for old firmware.
if (!(await signer.isSupported())) {
  throw new Error('card does not run the signing-only firmware');
}

const path = utils.getFullPath({ pathType: config.PathType.BIP32, pathString: "44'/60'/0'/0/0" });
const { der, r, s } = await signer.signSecp256k1(path, digest);
```

## Methods

| Method | Path type | Data | Result |
|---|---|---|---|
| `signSecp256k1(path, digest)` | `32` | 32-byte digest | `{ curve, der, r, s }` (low-S, 32-byte `r` / `s`, no recovery id) |
| `signSchnorr(path, digest)` | `34` or `32` | 32-byte digest | `{ curve, signature }` 64 bytes |
| `signEd25519(path, message)` | `10` / `42` | raw message | `{ curve, signature }` 64 bytes |
| `signBip32Ed25519(path, message)` | `17` | raw message | `{ curve, signature }` 64 bytes |

- All inputs and outputs are hex strings; `0x` prefixes are accepted.
- Paths use the SDK hex format `[pathType 1B][index 4B]...` with at most 5 indices, e.g. the output of `utils.getFullPath`.
- `signSchnorr` applies the BIP-86 taproot tweak only for a path type `34` path with exactly 5 indices (`m/86'/0'/0'/0/0`); other depths and path type `32` sign with the untweaked key.
- Validation, the firmware check and result formatting are done by `coin.signData` in `@coolwallet/core`; errors from there are passed through unchanged.
- Each call sends three APDUs (version, nonce, sign). Sign sequentially on one transport: concurrent calls overwrite each other's nonce.
