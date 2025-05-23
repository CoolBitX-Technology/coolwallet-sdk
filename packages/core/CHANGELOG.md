# Changelog

## 2.0.3
- feat(core): add hooks to BleTransport

## 2.0.2
- implement signECDSA to improve signing speed

## 2.0.1

- 🐛 fix: create wallet from seed issue (Go SE 13) (#997)
- 🐛 fix: firmware update failed if no applet (#1001)

## 1.2.0-beta.0

### Breaking

- [`updateSE`](./src/apdu/ota/ota.ts#updateSE) function parameters type has been modified (#924)

### Changed

- remove OTA api secret (#924)
