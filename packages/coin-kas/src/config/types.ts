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
  scriptType?: ScriptType;
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
  scriptType?: ScriptType;
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

export declare type TransactionUtxo = {
  version: number;
  pkScript: Buffer;
  amount: string | number;
  scriptType: ScriptType;
};

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
  scriptType: ScriptType;
  scriptPublicKey: string;
  publicKeyOrScriptHash: string;
};

export declare type TxInfo = {
  txSize: number;
  mass: number;
};

export enum ScriptType {
  P2PK_SCHNORR = 0,
  P2PK_ECDSA = 1,
  P2SH = 2, // not support pubKeyToHash
}

export enum AddressVersion {
  PUBKEY = 0,
  PUBKEY_ECDSA = 1,
  SCRIPT_HASH = 8,
}

export declare type Payment = {
  address: string;
  outScript: Buffer;
};

export declare type Script = {
  scriptType: ScriptType;
  outScript: Buffer;
  outPubkeyOrHash: Buffer;
};

export const TransactionSigningHashKey = Buffer.from('TransactionSigningHash');
export const TransactionIDKey = Buffer.from('TransactionID');
export const PersonalMessageSigningHashKey = Buffer.from('PersonalMessageSigningHash');
