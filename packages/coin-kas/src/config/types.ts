import { Transport } from '@coolwallet/core';
export { Transport };

export type Callback = () => void;

export declare type SignTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  scriptType: ScriptType;
  inputs: Input[];
  output: Output;
  change?: Change;
  version?: number;
  confirmCB?: Callback;
  authorizedCB?: Callback;
};

export declare type Input = {
  preTxHash: string;
  preIndex: number;
  preValue: string;
  addressIndex: number;
  sequence?: number;
  pubkeyBuf?: Buffer;
  purposeIndex?: number;
};

export declare type Output = {
  value: string;
  address: string;
};

export declare type Change = {
  value: string;
  addressIndex: number;
  pubkeyBuf?: Buffer;
  purposeIndex?: number;
};

export declare type TxData = {
  version: number;
  inputs: Input[];
  output: Output;
  change?: Change;
  dustSize?: string;
};

export declare type TransactionInput = {
  previousOutpoint: Outpoint;
  signatureScript: string;
  sequence: string | number;
  sigOpCount: number;
  addressIndex: number;
};

export declare type TransactionUtxo = { pkScript: Buffer; amount: string | number };

export declare type Outpoint = {
  transactionId: string;
  index: number;
};

export declare type TransactionOutput = {
  amount: string | number;
  scriptPublicKey: ScriptPublicKey;
  addressIndex?: number;
};

export declare type ScriptPublicKey = {
  version: number;
  scriptPublicKey: string;
};

export declare type TxInfo = {
  txSize: number;
  mass: number;
};

export enum ScriptType {
  P2PK_SCHNORR = 0,
  P2PK_ECDSA = 1,
  // P2SH = 8,      // not support pubKeyToHash
}

export declare type Payment = {
  address: string;
  outScript: Buffer;
};

export declare type Script = {
  scriptType: ScriptType;
  outScript: Buffer;
  outHash?: Buffer;
};

export const TransactionSigningHashKey = Buffer.from('TransactionSigningHash');
export const TransactionIDKey = Buffer.from('TransactionID');
export const PersonalMessageSigningHashKey = Buffer.from('PersonalMessageSigningHash');
