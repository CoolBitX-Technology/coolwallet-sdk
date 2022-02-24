import { Transport } from '@coolwallet/core';

export { Transport };

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Record<string, any>;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};
