import { Transport } from '@coolwallet/core';
export { Transport };

export type Integer = string | number;

export interface Options {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  confirmCB?: () => void;
  authorizedCB?: () => void;
}

export interface Transaction {
  keyIndex: number;
  sender: string;
  sequence: Integer;
  receiver: string;
  amount: Integer;
  gasLimit: Integer;
  gasPrice: Integer;
  expiration: Integer;
  chainId: Integer;
}
