import { apdu, tx, error } from '@coolwallet/core';
import isNil from 'lodash/isNil';
import RLP from 'rlp';
import {
  getLegacyRawHex,
  getEIP712TypedDataRawHex,
  getEIP712MessageRawHex,
  getEIP1559RawHex,
} from './utils/rawTransaction';
import { genEthSigFromSESig, composeSignedTransaction } from './utils/signature';
import type {
  BaseTransaction,
  EIP1559Transaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
  LegacyTransaction,
} from './transaction/types';
import { formatHex } from './utils/string';

type SignatureData = { v: number; r: string; s: string };

async function signSingleTransaction(
  client: BaseTransaction,
  script: string,
  argument: string,
  rawPayload: Buffer,
  publicKey?: string
): Promise<SignatureData> {
  const { transport, appId, appPrivateKey } = client;
  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    client.confirmCB,
    client.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    return genEthSigFromSESig(canonicalSignature, rawPayload, publicKey);
  } else {
    throw new error.SDKError(signSingleTransaction.name, 'canonicalSignature type error');
  }
}

async function signLegacyTransactionSegmentally(
  client: LegacyTransaction,
  script: string,
  argument: string,
  data: string,
  chainId: number,
  publicKey?: string
) {
  const { transport, transaction, appId, appPrivateKey } = client;

  const rawPayload = getLegacyRawHex(transaction, chainId);

  const preActions = [
    () => apdu.tx.sendScript(transport, script),
    () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument),
  ];
  const action = () => apdu.tx.executeSegmentScript(transport, appId, appPrivateKey, formatHex(data));

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    client.confirmCB,
    client.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const { v, r, s } = await genEthSigFromSESig(canonicalSignature, Buffer.from(RLP.encode(rawPayload)), publicKey);
    const vValue = v + 27 + chainId * 2 + 8;
    // remove default r, s in rlpList.
    return composeSignedTransaction(rawPayload.slice(0, 6), vValue, r, s);
  } else {
    throw new error.SDKError(signLegacyTransactionSegmentally.name, 'canonicalSignature type error');
  }
}

async function signEIP1559TransactionSegmentally(
  client: EIP1559Transaction,
  script: string,
  argument: string,
  data: string,
  chainId: number,
  publicKey?: string
) {
  const { transport, transaction, appId, appPrivateKey } = client;

  const rawPayload = getEIP1559RawHex(transaction, chainId);

  const preActions = [
    () => apdu.tx.sendScript(transport, script),
    () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument),
  ];
  const action = () => apdu.tx.executeSegmentScript(transport, appId, appPrivateKey, formatHex(data));

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    client.confirmCB,
    client.authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const prefix = Buffer.from('02', 'hex');
    const { v, r, s } = await genEthSigFromSESig(
      canonicalSignature,
      Buffer.concat([prefix, Buffer.from(RLP.encode(rawPayload))]),
      publicKey
    );
    return composeSignedTransaction(rawPayload, v, r, s, '0x02');
  } else {
    throw new error.SDKError(signLegacyTransactionSegmentally.name, 'canonicalSignature type error');
  }
}

async function signLegacyTransaction(
  client: LegacyTransaction,
  script: string,
  argument: string,
  chainId: number,
  publicKey?: string
) {
  const { transaction } = client;

  const rawPayload = getLegacyRawHex(transaction, chainId);

  const { v, r, s } = await signSingleTransaction(
    client,
    script,
    argument,
    Buffer.from(RLP.encode(rawPayload)),
    publicKey
  );
  const vValue = v + 27 + chainId * 2 + 8;
  // remove default r, s in rlpList.
  return composeSignedTransaction(rawPayload.slice(0, 6), vValue, r, s);
}

async function signEIP1559Transaction(
  client: EIP1559Transaction,
  script: string,
  argument: string,
  chainId: number,
  publicKey?: string
) {
  const { transaction } = client;

  const rawPayload = getEIP1559RawHex(transaction, chainId);
  const prefix = Buffer.from('02', 'hex');
  const payload = [prefix, Buffer.from(RLP.encode(rawPayload))];

  const { v, r, s } = await signSingleTransaction(client, script, argument, Buffer.concat(payload), publicKey);
  return composeSignedTransaction(rawPayload, v, r, s, '0x02');
}

async function signEIP712TypedDataTransaction(
  client: EIP712TypedDataTransaction,
  script: string,
  argument: string,
  publicKey?: string
) {
  const { typedData } = client;

  const rawPayload = getEIP712TypedDataRawHex(typedData);

  const { v, r, s } = await signSingleTransaction(client, script, argument, rawPayload, publicKey);
  return `0x${r.padStart(64, '0')}${s.padStart(64, '0')}${(v + 27).toString(16)}`;
}

async function signEIP712MessageTransaction(
  client: EIP712MessageTransaction,
  script: string,
  argument: string,
  publicKey?: string
) {
  const { message } = client;

  const rawPayload = getEIP712MessageRawHex(message);

  const { v, r, s } = await signSingleTransaction(client, script, argument, rawPayload, publicKey);
  return `0x${r.padStart(64, '0')}${s.padStart(64, '0')}${(v + 27).toString(16)}`;
}

async function signTransaction(
  client: BaseTransaction,
  script: string,
  argument: string,
  chainId: number,
  publicKey?: string
): Promise<string> {
  const transaction = (client as LegacyTransaction).transaction;
  const typedData = (client as EIP712TypedDataTransaction).typedData;
  const message = (client as EIP712MessageTransaction).message;

  if (!isNil(transaction)) {
    return signLegacyTransaction(client as LegacyTransaction, script, argument, chainId, publicKey);
  }
  if (!isNil(typedData)) {
    return signEIP712TypedDataTransaction(client as EIP712TypedDataTransaction, script, argument, publicKey);
  }
  if (!isNil(message)) {
    return signEIP712MessageTransaction(client as EIP712MessageTransaction, script, argument, publicKey);
  }

  return '';
}

export { signTransaction, signEIP1559Transaction, signLegacyTransactionSegmentally, signEIP1559TransactionSegmentally };
