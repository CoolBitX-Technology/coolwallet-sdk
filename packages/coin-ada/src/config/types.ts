import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  scriptType: ScriptType;
  invalidHereafter: number;
  input: Input;
  output: Output;
  change: Change;
  fee: string;
  confirmCB?: Function;
  authorizedCB?: Function;
};

export type Input = {
  addressIndex: number;
  utxos: [Utxo];
  pubkeyBuf?: Buffer;
};

export type Utxo = {
  preTxHash: string;
  preIndex: number;
};

export type Output = {
  value: string;
  address: string;
};

export type Change = {
  value: string;
  addressIndex: number;
  pubkeyBuf: Buffer;
};

export enum ScriptType {
  P2PKH = 0,
  P2SH = 1,
  P2POINTER = 2,
}
