import { Transport } from '@coolwallet/core';
export { Transport };


export type transaction = {
  sender: string;
  publicKey: string; 
  receiver: string;
  nonce: number;
  amount: string;
  recentBlockHash: string;
}

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: transaction;
  confirmCB?(): void;
  authorizedCB?(): void;
};
