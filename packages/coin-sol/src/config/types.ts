import { Transport } from '@coolwallet/core';
// export type Transport;

export type Address = string | Buffer;

export type TokenInfo = {
  name?: string;
  symbol: string;
  address: string;
  decimals: number;
  signature?: string;
};
/**
 * AccountMeta types
 * @param {pubkey} pubkey account publickey could be either string or Buffer
 * @param {isSigner} isSigner is this account was the signer of this instruction or not?
 * @param {isWritable} isWritable is this account have permission to write or not ?
 */
export type AccountMeta = {
  pubkey: Address;
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
  programId: Address;
  data: string | Buffer;
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
 * @param {string} txType payer of this transaction
 * @param {Address} feePayer payer of this transaction
 * @param {string} recentBlockhash recent blockHash, identification of new block alternative for nonce
 * @param {TransactionInstruction[]} instructions list of instruction per transaction
 * @param {boolean} showTokenInfo list of instruction per transaction
 */
export type TransactionArgs = {
  txType?: string;
  feePayer: Address;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
  showTokenInfo?: TokenInfo;
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: TransactionArgs;
  confirmCB?(): void;
  authorizedCB?(): void;
};
