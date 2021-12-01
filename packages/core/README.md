# CoolWallet Core SDK

CoolWallet software development kit built with Typescript.
Handles the apdu requests, cryptography and some common logic s for other CoolWallet SDKs.


![version](https://img.shields.io/npm/v/@coolwallet/core)
![Typed with TypeScript](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://gitter.im/jlongster/prettier)

## Install

```shell
npm install @coolwallet/core
```

## Project Structure

|   Directory  	|                                                                                   Features                                                                                  	|
|:------------:	|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------:	|
|     apdu     	|                                                                    Collections of APDU and MCU commands.                                                                    	|
|     coin     	|        Key derivation functions base on `ECDSA` and `EDDSA` algorithms. <br>All `@coolwallet/coin` packages will need to inherit `Coin` to work with Coolwallet SDK.        	|
|    config    	|                                        Config values and some pieces of information about the Coolwallet, like error codes/messages.                                        	|
|    crypto    	|                                                       Some cryptography we used commonly, ex. `hmac-sha512`, `sha256`.                                                      	|
|    device    	|                                       Maintain Bluetooth device connection and using `Transport` to communicate with Bluetooth device.                                      	|
|     error    	|                                                                    CoolWallet SDK internal error handler.                                                                   	|
|    setting   	|                                                                   Authentication settings for CoolWallet.                                                                   	|
| transcaction 	|                                                               Functions often used when creating transactions.                                                              	|
|   transport  	| Have two abstract classes, `BleManager` and `Transport`.<br>`BleManager` is responsible for `Bluetooth` status management and `Transport` is responsible for data transfer. 	|
|     utils    	|                                      Some utilities we used commonly, ex. serialize and deserialize the message from Bluetooth device.                                      	|