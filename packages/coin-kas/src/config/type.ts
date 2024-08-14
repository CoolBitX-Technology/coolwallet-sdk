import { Transport } from '@coolwallet/core';
export { Transport };

export type Callback = () => void;

export type SignTransferTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  txData: Omit<TxData, 'changeAddress'>;
  confirmCB?: Callback;
  authorizedCB?: Callback;
};

export type TxData = {
  inputs: Input[];
  outputs: Output[];
  fee: string;
  dustSize?: string;
  changeAddress: string;
};

export type TransactionInput = {
  previousOutpoint: Outpoint;
  signatureScript: string;
  sequence: string | number;
  sigOpCount: number;
};

export type TransactionUtxo = { pkScript: Buffer; amount: string | number };

export type Outpoint = {
  transactionId: string;
  index: number;
};

export type TransactionOutput = {
  amount: string | number;
  scriptPublicKey: ScriptPublicKey;
};

export type ScriptPublicKey = {
  version: number;
  scriptPublicKey: string;
};

export type Input = {
  txId: string;
  vout: number;
  address: string;
  value: string | number;
};

export type Output = {
  address: string;
  value: string | number;
};

export type TxInfo = {
  txSize: number;
  mass: number;
};

export const TransactionSigningHashKey = Buffer.from('TransactionSigningHash');
export const TransactionIDKey = Buffer.from('TransactionID');
export const PersonalMessageSigningHashKey = Buffer.from('PersonalMessageSigningHash');
