import { Transport } from '@coolwallet/core';
export { Transport };

export type Callback = () => void;

export type signTxType = {
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

export type Input = {
  preTxHash: string;
  preIndex: number;
  preValue: string;
  sequence?: number;
  addressIndex: number;
  pubkeyBuf?: Buffer;
  purposeIndex?: number;
};

export type Output = {
  value: string;
  address: string;
};

export type Change = {
  value: string;
  addressIndex: number;
  pubkeyBuf?: Buffer;
  purposeIndex?: number;
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
    purposeIndex?: number;
  }[];
  outputType: ScriptType;
  outputsCount: Buffer;
  outputsBuf: Buffer;
  lockTimeBuf: Buffer;
};

export enum ScriptType {
  P2PKH = 0,
  P2SH = 1,
}
