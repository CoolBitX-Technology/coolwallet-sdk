import { transport } from '@coolwallet/core';
import * as BN from 'bn.js';

export type Transport = transport.default;



type SignTxData = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  confirmCB: () => void | undefined,
  authorizedCB: () => void | undefined
}

export type dotTransaction = {
  // [key: string]: any,
  fromAddress: string,
  blockHash: string,
  blockNumber: string,
  era: string,
  genesisHash: string,
  nonce: string,
  specVersion: string,
  tip: string,
  transactionVersion: string,
  version: number
}

export interface NormalTransferData extends SignTxData {
  transaction: NormalTx
}

export interface NormalTx extends dotTransaction {
  method: NormalMethod
}
export interface NormalMethod {
  destAddress: string,
  value: string
}

export interface BondData extends SignTxData {
  transaction: BondTx
}

export interface BondTx extends dotTransaction {
  method: BondMethod
}
export interface BondMethod {
  controllerAddress: string,
  value: string,
  // payee: string
}

export interface UnbondData extends SignTxData {
  transaction: UnbondTx
}

export interface UnbondTx extends dotTransaction {
  method: UnbondMethod
}
export interface UnbondMethod {
  value: string,
}

export interface NominateData extends SignTxData {
  transaction: NominateTx
}

export interface NominateTx extends dotTransaction {
  method: NominateMethod
}
export interface NominateMethod {
  targetAddress: string,
}


export interface WithdrawUnbondedData extends SignTxData {
  transaction: WithdrawUnbondedTx
}

export interface WithdrawUnbondedTx extends dotTransaction {
  method: WithdrawUnbondedMethod
}
export interface WithdrawUnbondedMethod {
  numSlashingSpans: string,
}

export interface FormatTransfer {
  mortalEra: string,
  nonce: string,
  encodeNonce: string
  tip: string,
  encodeTip: string,
  specVer: string,
  txVer: string,
  blockHash: string,
  genesisHash: string
}

export interface FormatNormalMethod {
  callIndex: string,
  destAddress: string,
  value: string
}


export interface FormatBondMethod {
  callIndex: string,
  controllerAddress: string,
  value: string
}

export interface FormatUnbondMethod {
  callIndex: string,
  value: string
}

export interface FormatNominateMethod {
  callIndex: string,
  addressCount: string,
  targetAddress: string
}

export interface FormatWithdrawUnbondedTxMethod {
  callIndex: string,
  numSlashingSpans: string
}

export interface ToBn {
  toBn: () => BN;
}


export interface ToBnOptions {
  isLe?: boolean;
  isNegative?: boolean;
}

export type FnType = Function;
