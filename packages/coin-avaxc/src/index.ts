import { coin as COIN, Transport, utils, config, apdu, tx, setting } from '@coolwallet/core';
import * as params from './params';
import { TypedDataUtils as typedDataUtils } from 'eth-sig-util';

const bip32 = require('bip32');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak');
const rlp = require('rlp');
const Ajv = require('ajv');

import { Transaction, Erc20Transaction, handleHex, getRawTx, hexToBuffer, removeHex0x, asciiToHex } from './utils';

export default class AVAXC implements COIN.Coin {
  getPublicKey = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const path = utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'`,
    });

    const accExtKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);

    const accExtKeyBuf = Buffer.from(accExtKey, 'hex');
    const accPublicKey = accExtKeyBuf.slice(0, 33);
    const accChainCode = accExtKeyBuf.slice(33);

    const accNode = bip32.fromPublicKey(accPublicKey, accChainCode);
    const changeNode = accNode.derive(0);
    const addressNode = changeNode.derive(addressIndex);
    const publicKey = addressNode.publicKey.toString('hex');
    return publicKey;
  };

  getAddress = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number
  ): Promise<string> => {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const uncompressedKey = ec.keyFromPublic(publicKey, 'hex').getPublic(false, 'hex');

    const keyBuffer = Buffer.from(uncompressedKey.substr(2), 'hex');

    const keyHash = createKeccakHash('keccak256').update(keyBuffer).digest('hex');

    const address = '0x'.concat(keyHash.substr(-40));

    return address;
  };

  signTransaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: Transaction
  ): Promise<string> => {
    await apdu.tx.sendScript(transport, params.Transfer.script + params.Transfer.signature);

    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'/0/0`,
    });

    const argument =
      '15' +
      path +
      handleHex(transaction.to) +
      handleHex(transaction.value).padStart(20, '0') +
      handleHex(transaction.gasPrice).padStart(20, '0') +
      handleHex(transaction.gasLimit).padStart(20, '0') +
      handleHex(transaction.nonce).padStart(16, '0') +
      handleHex(params.ChainId.toString(16)).padStart(4, '0') +
      handleHex(transaction.data);

    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

    await apdu.tx.finishPrepare(transport);

    await apdu.tx.getTxDetail(transport);

    const decryptingKey = await apdu.tx.getSignatureKey(transport);

    await apdu.tx.clearTransaction(transport);

    await apdu.mcu.control.powerOff(transport);

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);

    const { signedTx } = await apdu.tx.getSignedHex(transport);

    const rawTx = getRawTx(transaction);

    const rawData = Buffer.from(rlp.encode(rawTx));

    if (rawData.toString('hex') !== signedTx) {
      throw new Error('unexpected transaction format!');
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');

    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);

    const v = recoveryParam + 27;
    const { r, s } = sig as { r: string; s: string };

    let vValue = v + params.ChainId * 2 + 8;

    vValue = vValue.toString(16).padStart(6, '0');

    const signedTransaction = rawTx.slice(0, 6);

    signedTransaction.push(Buffer.from(vValue, 'hex'), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
    const serializedTx = Buffer.from(rlp.encode(signedTransaction));

    return `0x${serializedTx.toString('hex')}`;
  };

  signERC20Transaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: Erc20Transaction
  ): Promise<string> => {
    const upperCaseAddress = `${transaction.to}`.toUpperCase();

    let token = {
      contractAddress: upperCaseAddress,
      symbol: transaction.symbol,
      decimals: transaction.decimals,
      signature: '',
    };

    for (const tokenInfo of params.Token) {
      if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress) {
        token = tokenInfo;
      }
    }
    if (token.symbol.length == 0) {
      throw new Error('unexpected transaction format!');
    }

    await apdu.tx.sendScript(transport, params.Erc20.script + params.Erc20.signature);

    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'/0/0`,
    });

    let symbol = token.symbol;
    const decimals = parseInt(token.decimals);

    const unit = handleHex(decimals.toString(16));
    if (symbol.length > 7) {
      symbol = symbol.substring(0, 7);
    }
    const len = handleHex(symbol.length.toString(16));
    const symb = handleHex(asciiToHex(symbol));
    const tokenInfo = unit + len + symb.padEnd(14, '0') + removeHex0x(transaction.to);

    const toAddress = transaction.data.slice(10, 74).replace(/\b(0+)/gi, '');
    const amount = transaction.data.slice(74).replace(/\b(0+)/gi, '');

    const tokenSignature = token.signature;

    const argument =
      '15' +
      path +
      handleHex(toAddress).padStart(40, '0') +
      handleHex(amount).padStart(24, '0') +
      handleHex(transaction.gasPrice).padStart(20, '0') +
      handleHex(transaction.gasLimit).padStart(20, '0') +
      handleHex(transaction.nonce).padStart(16, '0') +
      handleHex(params.ChainId.toString(16)).padStart(4, '0') +
      tokenInfo +
      tokenSignature.slice(58).padStart(144, '0');

    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

    await apdu.tx.finishPrepare(transport);

    await apdu.tx.getTxDetail(transport);

    const decryptingKey = await apdu.tx.getSignatureKey(transport);

    await apdu.tx.clearTransaction(transport);

    await apdu.mcu.control.powerOff(transport);

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);

    const { signedTx } = await apdu.tx.getSignedHex(transport);

    const rawTx = getRawTx(transaction);

    const rawData = Buffer.from(rlp.encode(rawTx));

    if (rawData.toString('hex') !== signedTx) {
      throw new Error('unexpected transaction format!');
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');

    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);

    const v = recoveryParam + 27;
    const { r, s } = sig as { r: string; s: string };

    let vValue = v + params.ChainId * 2 + 8;

    vValue = vValue.toString(16).padStart(6, '0');

    const signedTransaction = rawTx.slice(0, 6);

    signedTransaction.push(Buffer.from(vValue, 'hex'), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
    const serializedTx = Buffer.from(rlp.encode(signedTransaction));
    return `0x${serializedTx.toString('hex')}`;
  };

  signSmartContractTransaction = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    transaction: Transaction
  ): Promise<string> => {
    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'/0/0`,
    });

    let argument = '';
    let encryptedSig: string | undefined;

    if (transaction.data.length > 8000) {
      argument =
        '15' +
        path +
        handleHex(transaction.to) +
        handleHex(transaction.value).padStart(20, '0') +
        handleHex(transaction.gasPrice).padStart(20, '0') +
        handleHex(transaction.gasLimit).padStart(20, '0') +
        handleHex(transaction.nonce).padStart(16, '0') +
        (handleHex(transaction.data).length / 2).toString(16).padStart(8, '0');

      await apdu.tx.sendScript(transport, params.SmartContractSegment.script + params.SmartContractSegment.signature);

      await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

      encryptedSig = await apdu.tx.executeSegmentScript(transport, appId, appPrivateKey, handleHex(transaction.data));
    } else {
      argument =
        '15' +
        path +
        handleHex(transaction.to) +
        handleHex(transaction.value).padStart(20, '0') +
        handleHex(transaction.gasPrice).padStart(20, '0') +
        handleHex(transaction.gasLimit).padStart(20, '0') +
        handleHex(transaction.nonce).padStart(16, '0') +
        handleHex(params.ChainId.toString(16)).padStart(4, '0') +
        handleHex(transaction.data);

      await apdu.tx.sendScript(transport, params.SmartContract.script + params.SmartContract.signature);

      encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);
    }

    await apdu.tx.finishPrepare(transport);

    await apdu.tx.getTxDetail(transport);

    const decryptingKey = await apdu.tx.getSignatureKey(transport);

    await apdu.tx.clearTransaction(transport);

    await apdu.mcu.control.powerOff(transport);

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);

    const rawTx = getRawTx(transaction);

    const rawData = Buffer.from(rlp.encode(rawTx));

    if (transaction.data.length <= 8000) {
      const { signedTx } = await apdu.tx.getSignedHex(transport);
      if (rawData.toString('hex') !== signedTx) {
        throw new Error('unexpected transaction format!');
      }
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');

    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);

    const v = recoveryParam + 27;
    const { r, s } = sig as { r: string; s: string };

    let vValue = v + params.ChainId * 2 + 8;

    vValue = vValue.toString(16).padStart(6, '0');

    const signedTransaction = rawTx.slice(0, 6);

    signedTransaction.push(Buffer.from(vValue, 'hex'), Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
    const serializedTx = Buffer.from(rlp.encode(signedTransaction));

    return `0x${serializedTx.toString('hex')}`;
  };

  signMessage = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    message: string
  ): Promise<string> => {
    await setting.auth.versionCheck(transport, 81);

    await apdu.tx.sendScript(transport, params.Message.script + params.Message.signature);

    const msgHex = handleHex(message);

    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'/0/0`,
    });

    const argument = '15' + path + Buffer.from((msgHex.length / 2).toString()).toString('hex') + msgHex;

    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

    await apdu.tx.finishPrepare(transport);

    await apdu.tx.getTxDetail(transport);

    const decryptingKey = await apdu.tx.getSignatureKey(transport);

    await apdu.tx.clearTransaction(transport);

    await apdu.mcu.control.powerOff(transport);

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);

    const { signedTx } = await apdu.tx.getSignedHex(transport);

    const msgBuf = hexToBuffer(msgHex);
    const lenBuf = Buffer.from(msgBuf.length.toString(), 'ascii');

    const rawData = Buffer.concat([
      Buffer.from('19', 'hex'),
      Buffer.from('Ethereum Signed Message:', 'ascii'),
      Buffer.from('0A', 'hex'),
      lenBuf,
      msgBuf,
    ]);

    if (rawData.toString('hex') !== signedTx) {
      throw new Error('unexpected transaction format!');
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');

    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);

    const v = (recoveryParam + 27).toString(16);

    const { r, s } = sig as { r: string; s: string };

    return `0x${r}${s}${v}`;
  };

  signTypedData = async (
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    typedData: any
  ): Promise<string> => {
    await setting.auth.versionCheck(transport, 84);

    await apdu.tx.sendScript(transport, params.TypedData.script + params.TypedData.signature);

    const EIP712Schema = {
      type: 'object',
      properties: {
        types: {
          type: 'object',
          properties: {
            EIP712Domain: { type: 'array' },
          },
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
              },
              required: ['name', 'type'],
            },
          },
          required: ['EIP712Domain'],
        },
        primaryType: { type: 'string' },
        domain: { type: 'object' },
        message: { type: 'object' },
      },
      required: ['types', 'primaryType', 'domain', 'message'],
    };

    const ajv = new Ajv({ allErrors: true, inlineRefs: false });

    if (!ajv.validate(EIP712Schema, typedData)) {
      throw new Error(ajv.errorsText());
    }

    const path = await utils.getFullPath({
      pathType: config.PathType.BIP32,
      pathString: `44'/${params.PathString}'/0'/0/0`,
    });

    const sanitizedData = typedDataUtils.sanitizeData(typedData);

    const encodedData = typedDataUtils.encodeData(
      `${sanitizedData.primaryType}`,
      sanitizedData.message,
      sanitizedData.types
    );

    const domainSeparate = typedDataUtils.hashStruct('EIP712Domain', sanitizedData.domain, sanitizedData.types);

    const argument =
      '15' +
      path +
      handleHex(domainSeparate.toString('hex')).padStart(64, '0') +
      handleHex(encodedData.toString('hex'));

    const encryptedSig = await apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

    await apdu.tx.finishPrepare(transport);

    await apdu.tx.getTxDetail(transport);
    const decryptingKey = await apdu.tx.getSignatureKey(transport);
    await apdu.tx.clearTransaction(transport);

    await apdu.mcu.control.powerOff(transport);

    const sig = tx.util.decryptSignatureFromSE(encryptedSig!, decryptingKey, tx.SignatureType.Canonical);

    const { signedTx } = await apdu.tx.getSignedHex(transport);

    const dataBuf = createKeccakHash('keccak256').update(encodedData).digest();

    const rawData = Buffer.concat([Buffer.from('1901', 'hex'), domainSeparate, dataBuf]);

    if (rawData.toString('hex') !== signedTx) {
      throw new Error('unexpected transaction format!');
    }

    const hash = createKeccakHash('keccak256').update(rawData).digest('hex');

    const data = Buffer.from(handleHex(hash), 'hex');

    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

    const keyPair = ec.keyFromPublic(publicKey, 'hex');

    const recoveryParam = ec.getKeyRecoveryParam(data, sig, keyPair.pub);

    const v = (recoveryParam + 27).toString(16);
    const { r, s } = sig as { r: string; s: string };

    return `0x${r}${s}${v}`;
  };
}
