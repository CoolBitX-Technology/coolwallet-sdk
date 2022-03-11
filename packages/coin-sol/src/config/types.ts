import { Transport } from '@coolwallet/core';
// export type Transport;

export type header = {
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
};

export type instruction = {
  accounts: number[];
  data: string;
  programIdIndex: number;
};

export type messageType = {
  header: header;
  accountKeys: Buffer[];
  recentBlockhash: string;
  instructions: instruction[];
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  message: messageType;
  confirmCB: Function | undefined;
  authorizedCB: Function | undefined;
};
