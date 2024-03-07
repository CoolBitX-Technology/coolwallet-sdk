import { Transport } from '@coolwallet/core';
import { PublicKey } from '../utils/publickey';
import {  VersionedMessage } from '../message';
import { TOKEN_PROGRAM_ID,TOKEN_2022_PROGRAM_ID } from  './params';

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
 * Blockhash as Base58 string.
 */
export type Blockhash = string;

/**
 * An instruction to execute by a program
 *
 * @property {number} programIdIndex
 * @property {number[]} accounts
 * @property {string} data
 */
export type CompiledInstruction = {
  /** Index into the transaction keys array indicating the program account that executes this instruction */
  programIdIndex: number;
  /** Ordered indices into the transaction keys array indicating which accounts to pass to the program */
  accounts: number[];
  /** The program input data encoded as base 58 */
  data: string;
};

type AddressLookupTableState = {
  deactivationSlot: bigint;
  lastExtendedSlot: number;
  lastExtendedSlotStartIndex: number;
  authority?: PublicKey;
  addresses: Array<PublicKey>;
};

export type AddressLookupTableAccount = {
  key: PublicKey;
  state: AddressLookupTableState;
}

type LoadedAddresses = {
  writable: Array<PublicKey>;
  readonly: Array<PublicKey>;
};

export type AccountKeysFromLookups = LoadedAddresses;

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

export type TokenProgramId = typeof TOKEN_PROGRAM_ID | typeof TOKEN_2022_PROGRAM_ID;

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
  programId: TokenProgramId;
};

export type AssociateTokenAccountTransaction = {
  owner: Address;
  associateAccount: Address;
  token: Address;
  recentBlockhash: string;
  programId: TokenProgramId;
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
  programId: TokenProgramId;
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

interface VersionedTransaction <T extends VersionedMessage> {
  signatures: Array<Uint8Array>;
  message: T;
}

export enum TokenInstruction {
  InitializeMint = 0,
  InitializeAccount = 1,
  InitializeMultisig = 2,
  Transfer = 3,
  Approve = 4,
  Revoke = 5,
  SetAuthority = 6,
  MintTo = 7,
  Burn = 8,
  CloseAccount = 9,
  FreezeAccount = 10,
  ThawAccount = 11,
  TransferChecked = 12,
  ApproveChecked = 13,
  MintToChecked = 14,
  BurnChecked = 15,
  InitializeAccount2 = 16,
  SyncNative = 17,
  InitializeAccount3 = 18,
  InitializeMultisig2 = 19,
  InitializeMint2 = 20,
  GetAccountDataSize = 21,
  InitializeImmutableOwner = 22,
  AmountToUiAmount = 23,
  UiAmountToAmount = 24,
  InitializeMintCloseAuthority = 25,
  TransferFeeExtension = 26,
  ConfidentialTransferExtension = 27,
  DefaultAccountStateExtension = 28,
  Reallocate = 29,
  MemoTransferExtension = 30,
  CreateNativeMint = 31,
  InitializeNonTransferableMint = 32,
  InterestBearingMintExtension = 33,
  CpiGuardExtension = 34,
  InitializePermanentDelegate = 35,
  TransferHookExtension = 36,
  // ConfidentialTransferFeeExtension = 37,
  // WithdrawalExcessLamports = 38,
  MetadataPointerExtension = 39,
}

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

export type signVersionedTransactionType = Mandatory<VersionedTransaction<VersionedMessage>>
export type signVersionedTransactions = Mandatory<VersionedTransaction<VersionedMessage>[]>

export type signTxType =
  | signTransactionType
  | signTransferTransactionType
  | signCreateAndTransferSplTokenTransaction
  | signTransferSplTokenTransactionType
  | signAssociateTokenAccountTransactionType
  | signDelegateType
  | signUndelegateType
  | signDelegateAndCreateAccountWithSeedType
  | signStakingWithdrawType
  | signVersionedTransactionType
  | signVersionedTransactions;

export type signMsgType = signSignInMessageType | signMessageType;

export type SignDataType = signTxType | signMsgType;
