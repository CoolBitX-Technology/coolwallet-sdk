import { Transport } from '@coolwallet/core';

export type Address = string | Buffer;

export type TokenInfo = {
  symbol: string;
  decimals: number | string;
  address: string;
  signature?: string;
};

export type LockupRaw = Readonly<{
  custodian: Uint8Array;
  epoch: number;
  unixTimestamp: number;
}>;

export type AuthorizedRaw = Readonly<{
  staker: Uint8Array;
  withdrawer: Uint8Array;
}>;

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
 */
export type TransactionArgs = {
  feePayer: Address;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
};

export type TransferTransaction = {
  toPubkey: Address;
  recentBlockhash: string;
  lamports: number | string;
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

export type CreateAndTransferSplTokenTransaction = {
  fromTokenAccount: Address;
  toPubkey: Address;
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

export type Delegate = {
  stakePubkey: Address;
  authorizedPubkey: Address;
  votePubkey: Address;
  recentBlockhash: string;
};

export type Undelegate = {
  stakePubkey: Address;
  authorizedPubkey: Address;
  recentBlockhash: string;
};

export type DelegateAndCreateAccountWithSeed = {
  newAccountPubkey?: Address;
  votePubkey: Address;
  seed: string;
  lamports: string | number;
  recentBlockhash: string;
};

export type StakingWithdrawTransaction = {
  stakePubkey: Address;
  withdrawToPubKey: Address;
  recentBlockhash: string;
  lamports: number | string;
};

export type SignInMessage = {
  domain: string;
  address: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
};

type Mandatory<T> = T extends SignInMessage | string
  ? {
    transport: Transport;
    appPrivateKey: string;
    appId: string;
    message: T;
    addressIndex: number;
    confirmCB?(): void;
    authorizedCB?(): void;
  }
  : {
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

export type signCreateAndTransferSplTokenTransaction = Mandatory<CreateAndTransferSplTokenTransaction>;

export type signDelegateType = Mandatory<Delegate>;

export type signUndelegateType = Mandatory<Undelegate>;

export type signDelegateAndCreateAccountWithSeedType = Mandatory<DelegateAndCreateAccountWithSeed>;

export type signStakingWithdrawType = Mandatory<StakingWithdrawTransaction>;

export type signSignInMessageType = Mandatory<SignInMessage>;
export type signMessageType = Mandatory<string>;

export type signTxType =
  | signTransactionType
  | signTransferTransactionType
  | signCreateAndTransferSplTokenTransaction
  | signTransferSplTokenTransactionType
  | signAssociateTokenAccountTransactionType
  | signDelegateType
  | signUndelegateType
  | signDelegateAndCreateAccountWithSeedType
  | signStakingWithdrawType;

export type signMsgType = signSignInMessageType | signMessageType;
