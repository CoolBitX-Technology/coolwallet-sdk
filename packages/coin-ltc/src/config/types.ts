import { Transport } from '@coolwallet/core';

export { Transport };

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  scriptType: ScriptType;
  inputs: Array<Input>;
  output: Output;
  change?: Change;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export enum ScriptType {
  P2PKH = 0,
  P2SH_P2WPKH = 1,
  P2WPKH = 2,
  P2WSH = 3,
}

export type Input = {
  preTxHash: string;
  preIndex: number;
  preValue: string;
  sequence?: number;
  addressIndex: number;
  pubkeyBuf?: Buffer;
};

export type Output = {
  value: string;
  address: string;
};

export type Change = {
  value: string;
  addressIndex: number;
  pubkeyBuf?: Buffer;
};

export type PreparedData = {
  versionBuf: Buffer;
  inputsCount: Buffer;
  preparedInputs: {
    addressIndex: number;
    pubkeyBuf: Buffer;
    preOutPointBuf: Buffer;
    preValueBuf: Buffer;
    sequenceBuf: Buffer;
  }[];
  outputType: ScriptType;
  outputsCount: Buffer;
  outputsBuf: Buffer;
  lockTimeBuf: Buffer;
};
