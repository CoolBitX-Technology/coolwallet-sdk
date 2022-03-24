import { Transport } from '@coolwallet/core';
// export type Transport;

/**
 * TransactionOptions types
 * @param {programId} programId can be programId of smart contract or spl token
 * @param {data} data smart contract data only
 * @param {owner} owner owner of from associate account when execute spl token transfer
 * @param {decimals} decimals spl token decimals
 * @param {value} value amount of spl token to send
 */
export type TransactionOptions = {
  programId?: string | Buffer;
  data?: string | Buffer;
  owner?: string | Buffer;
  decimals?: number;
  value?: number | string;
};

/**
 * TransactionType types
 * @param {fromPubkey} fromPubkey from address or from associate account
 * @param {toPubkey} toPubkey to address or to associate account
 * @param {recentBlockhash} recentBlockhash recent blockHash, identification of new block alternative for nonce
 * @param {amount} amount amount of native token or sol want to transfer
 * @param {options} TransactionOptions TransactionOptions for smart contract and spl token transfer
 */
export type TransactionType = {
  fromPubkey: string | Buffer;
  toPubkey: string | Buffer;
  recentBlockhash: string;
  amount?: number | string;
  options?: TransactionOptions;
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionType;
  confirmCB?: Function;
  authorizedCB?: Function;
};
