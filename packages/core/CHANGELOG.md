# Changelog

## 2.0.4
- feat(core): update @coolwallet/core 2.0.4 to export variable MCU_UPDATE_VER (#1031)

## 2.0.3
- feat(core): add hooks to BleTransport (#1010)
- chore(core): add logs control of PeripheralRequest (#1012)
- fix(core): update cardInfo.cardanoSeed type from string to boolean @coolwallet/core(2.0.3-beta.3) (#1014)

## 2.0.2
- chore: bump evm, core and testing-library to stable version (#1009)
- feat: add sign ecdsa method - [CW-24311] (#1003)
- feat: add sign tx hash to ecdsa coin (#1004)

## 2.0.1
- chore(core): bump @coolwallet/core to v2.0.1 (#1002)
- fix: create wallet from seed issue (#997)
- fix(core): CW-24221 firmware update failed if no applet (#1001)

## 2.0.0
- chore: upgrade core to 2.0.0 official (#990)
- feat(beat): CW-21046 refactor core  (#792)
- feat(core): CW-21046 refactor apdu command (#795)
- 🔀 chore: merge dev into beta at 2024-08-02 10:56 (#831)
- fix(backup): CW-20890 fix export data error (#833)
- fix(core): call getSEPublicKey will throw Error: Unknown point format (#834)
- feat(core): CW-21487 add backup test case (#841)
- 🐛 fix(core): error `Unknown point format` above Pro SE 338 (#843)
- feat(core): modify @coolwallet/core to support btc on lite (#840)
- ✨ feat(core): support firmware update for lite card (#872)
- chore(core): export getMainAppletAid, getNewSeVersion method from constant (#881)
- chore: merge dev into beta at 2024-09-16 17:42 (#883)
- chore: sync master into beta at 2025-01-13 (#931)
- ♻️ refactor: split transport and bletransport (#796)
- feat(core): support creating cardano seed on coolwallet go (#952)
- feat(core): rename lite to go (#973)
- ✨ feat: using new OTA service for Go (#922)
- fix: [CW-22271] add updateSEPart1 and updateSEPart2 to resolve iOS upgrade issue & update Go loadScript to v11 (#981)
- feat(core): CW-24146 upgrade core to 2.0.0-beta.24 to fix ota flow about delete and backup register data (#986)
- feat(core): CW-21046 fix wallet import issue (#799)
- ✨ feat(core): export BleTransport (#800)
- feat(Transport): export CardType from Transport (#803)
- feat(core): CW-21046 remove apdu method and update transaction flow for lite card (#805)
- feat(key): CW-20890 add lite card key (#818)
- ✨ feat: CW-21384 implement createSeedsHexByMnemonic (#825)
- feat(backup): CW-21131 add export and import key (#830)

## 1.2.0-beta.0

### Breaking

- [`updateSE`](./src/apdu/ota/ota.ts#updateSE) function parameters type has been modified (#924)

### Changed

- remove OTA api secret (#924)
