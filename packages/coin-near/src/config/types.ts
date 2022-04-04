import { Transport } from '@coolwallet/core';
export { Transport };


export type Transaction = {
  sender: string;
  publicKey: string; 
  receiver: string;
  nonce: number;
  amount: string;
  recentBlockHash: string;
}

export type SignTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Transaction;
  confirmCB?(): void;
  authorizedCB?(): void;
};
