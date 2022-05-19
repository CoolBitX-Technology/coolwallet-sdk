import { Transport } from '@coolwallet/core';

export type Address = string | Buffer;

export type TokenInfo = {
  symbol: string;
  decimals: number | string;
  address: string;
  signature?: string;
};

/**
 * AccountMeta types
 *
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
 *
 * @param {accounts} accounts list of account per this instruction
 * @param {programId} programId programId using for this instruction
 * @param {data} data instruction data
 */
export type TransactionInstruction = {
  accounts: AccountMeta[];
  programId: Address;
  data: Buffer;
};

/**
 * CompliedInstruction types for instruction encode
 *
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
 * Serialized Instructions from Message
 */
export type SerializedInstruction = {
  programIdIndex: number;
  keyIndicesCount: Buffer;
  keyIndices: number[];
  dataLength: Buffer;
  data: number[];
};

/**
 * TransactionArgs types for transaction input
 *
 * @param {string} txType payer of this transaction
 * @param {Address} feePayer payer of this transaction
 * @param {string} recentBlockhash recent blockHash, identification of new block alternative for nonce
 * @param {TransactionInstruction[]} instructions list of instruction per transaction
 * @param {boolean} showTokenInfo list of instruction per transaction
 */
export type TransactionArgs = {
  feePayer: Address;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
  showTokenInfo?: TokenInfo;
};

export type TransferTransaction = {
  toPubKey: Address;
  recentBlockhash: string;
  amount: number | string;
};

export type TransferSplTokenTransaction = {
  fromTokenAccount: Address;
  toTokenAccount: Address;
  recentBlockhash: string;
  amount: number | string;
  tokenInfo: {
    symbol: string;
    decimals: number | string;
    address: string;
    signature?: string;
  };
};

export type AssociateTokenAccountTransaction = {
  owner: Address;
  associateAccount: Address;
  token: Address;
  recentBlockhash: string;
};

export type StakingWithdrawTransaction = {
  authorizedPubkey: Address;
  stakePubkey: Address;
  withdrawToPubKey: Address;
  recentBlockhash: string;
  amount: number | string;
};

type Mandatory<T> = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: T;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type signTransactionType = Mandatory<TransactionArgs>;

export type signTransferTransactionType = Mandatory<TransferTransaction>;

export type signTransferSplTokenTransactionType = Mandatory<TransferSplTokenTransaction>;

export type signAssociateTokenAccountTransactionType = Mandatory<AssociateTokenAccountTransaction>;

export type signStakingWithdrawType = Mandatory<StakingWithdrawTransaction>;

export type signTxType =
  | signTransactionType
  | signTransferTransactionType
  | signTransferSplTokenTransactionType
  | signAssociateTokenAccountTransactionType
  | signStakingWithdrawType;
