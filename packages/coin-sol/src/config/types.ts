import { Transport } from '@coolwallet/core';
// export type Transport;

/**
 * TransferTxOptions types
 * @param {owner} owner owner of from associate account when execute spl token transfer
 * @param {decimals} decimals spl token decimals
 */
export type TransferTxOptions = {
  owner: string | Buffer;
  decimals?: number | string;
};

/**
 * TransferTransaction types for transfer transaction
 * @param {fromPubkey} fromPubkey from address or from associate account
 * @param {toPubkey} toPubkey to address or to associate account
 * @param {recentBlockhash} recentBlockhash recent blockHash, identification of new block alternative for nonce
 * @param {amount} amount amount of native token or sol want to transfer
 * @param {options} TransactionOptions TransactionOptions for smart contract and spl token transfer
 */
export type TransferTransaction = {
  fromPubkey: string | Buffer;
  toPubkey: string | Buffer;
  recentBlockhash: string;
  amount: number | string;
  options?: TransferTxOptions;
};

/**
 * AccountMeta types
 * @param {pubkey} pubkey account publickey could be either string or Buffer
 * @param {isSigner} isSigner is this account was the signer of this instruction or not?
 * @param {isWritable} isWritable is this account have permission to write or not ?
 */
export type AccountMeta = {
  pubkey: string | Buffer;
  isSigner: boolean;
  isWritable: boolean;
};

/**
 * TransactionInstruction types for instruction input
 * @param {accounts} accounts list of account per this instruction
 * @param {programId} programId programId using for this instruction
 * @param {data} data instruction data
 */
export type TransactionInstruction = {
  accounts: AccountMeta[];
  programId: string | Buffer;
  data?: string | Buffer;
};

/**
 * CompliedInstruction types for instruction encode
 * @param {accounts} accounts list of accounts index of instruction
 * @param {programIdIndex} programIdIndex instruction programId index
 * @param {data} data instruction data
 */
export type CompliedInstruction = {
  accounts: number[];
  programIdIndex: number;
  data: string;
};

/**
 * TransactionArgs types for transaction input
 * @param {feePayer} feePayer payer of this transaction
 * @param {recentBlockhash} recentBlockhash recent blockHash, identification of new block alternative for nonce
 * @param {instructions} instructions list of instruction per transaction
 */
export type TransactionArgs = {
  feePayer: string | Buffer;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionArgs | TransferTransaction;
  confirmCB?(): void;
  authorizedCB?(): void;
};
