import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  scriptType: ScriptType;
  inputs: [Input];
  output: Output;
  change?: Change;
  confirmCB?: Function;
  authorizedCB?: Function;
};

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

export enum ScriptType {
  P2PKH = 0,
  P2SH = 1,
  P2POINTER = 2,
}

export enum OmniType {
  USDT = 31,
}
