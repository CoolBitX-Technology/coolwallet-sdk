import { SDKError } from '@coolwallet/core/lib/error';
import * as types from '../config/types';
import * as scriptUtil from './scriptUtil';
import { Transaction } from './Transaction';
import { VersionedMessage } from '../message';
import {
  compileAssociateTokenAccount,
  compileDelegateAndCreateAccountWithSeed,
  compileSplTokenTransaction,
  compileStakingWithdraw,
  compileTransferTransaction,
  compileUndelegate,
} from './rawTransaction';

export enum ScriptArgumentType {
  Transfer = 'Transfer',
  SplTokenTransfer = 'SplTokenTransfer',
  CreateAndTransferSplToken = 'CreateAndTransferSplToken',
  Undelegate = 'Undelegate',
  DelegateAndCreateAccountWithSeed = 'DelegateAndCreateAccountWithSeed',
  StakingWithdraw = 'StakingWithdraw',
  Versioned = 'Versioned',
  SignIn = 'SignIn',
  SignMessage = 'SignMessage',
}

type TransferParams = {
  txType: ScriptArgumentType.Transfer;
  transaction: types.TransferTransaction;
  fromPubkey: types.Address;
  addressIndex: number;
};

type SplTokenTransferParams = {
  txType: ScriptArgumentType.SplTokenTransfer;
  transaction: types.TransferSplTokenTransaction;
  fromPubkey: types.Address;
  tokenInfo: types.TokenInfo;
  addressIndex: number;
};

type CreateAndTransferSplTokenParams = {
  txType: ScriptArgumentType.CreateAndTransferSplToken;
  transaction: types.CreateAndTransferSplTokenTransaction;
  fromPubkey: types.Address;
  tokenInfo: types.TokenInfo;
  addressIndex: number;
};

type UndelegateParams = {
  txType: ScriptArgumentType.Undelegate;
  transaction: types.Undelegate;
  fromPubkey: types.Address;
  addressIndex: number;
};

type DelegateAndCreateAccountParams = {
  txType: ScriptArgumentType.DelegateAndCreateAccountWithSeed;
  transaction: types.DelegateAndCreateAccountWithSeed;
  fromPubkey: types.Address;
  newAccountPubkey: types.Address;
  addressIndex: number;
};

type StakingWithdrawParams = {
  txType: ScriptArgumentType.StakingWithdraw;
  transaction: types.StakingWithdrawTransaction;
  fromPubkey: types.Address;
  addressIndex: number;
};

/** A transaction built elsewhere (dApp browser / WalletConnect); the SDK only signs it. */
type VersionedParams = {
  txType: ScriptArgumentType.Versioned;
  transaction: VersionedMessage;
  addressIndex: number;
};

/** Sign-In With Solana. Carries only the message — there is no transaction to serialize. */
type SignInParams = {
  txType: ScriptArgumentType.SignIn;
  message: types.SignInMessage;
  addressIndex: number;
};

/** An arbitrary message. Like {@link SignInParams}, it has no transaction to serialize. */
type SignMessageParams = {
  txType: ScriptArgumentType.SignMessage;
  message: string;
  addressIndex: number;
};

export type ScriptArgumentParams =
  | TransferParams
  | SplTokenTransferParams
  | CreateAndTransferSplTokenParams
  | UndelegateParams
  | DelegateAndCreateAccountParams
  | StakingWithdrawParams
  | VersionedParams
  | SignInParams
  | SignMessageParams;

type Result = {
  argument: string; // script's argument
  transaction?: Transaction | VersionedMessage; // final broadcastable transaction
};

export class ScriptArgument {
  private result?: Result;

  constructor(private readonly params: ScriptArgumentParams) {}

  toArgument(): string {
    return this.buildArgumentOnce().argument;
  }

  toTransaction(): Transaction | VersionedMessage {
    const { transaction } = this.buildArgumentOnce();
    if (!transaction) {
      throw new SDKError(this.toTransaction.name, 'this script argument has no transaction to serialize');
    }
    return transaction;
  }

  /**
   * Builds once and caches, so the argument the card signs and the transaction serialized for
   * broadcast always come from a single computation. Never call `buildArgument` directly.
   */
  private buildArgumentOnce(): Result {
    if (!this.result) this.result = this.buildArgument();
    return this.result;
  }

  private buildArgument(): Result {
    const { params } = this;
    switch (params.txType) {
      case ScriptArgumentType.Transfer:
        return this.buildTransfer(params);
      case ScriptArgumentType.SplTokenTransfer:
        return this.buildSplTokenTransfer(params);
      case ScriptArgumentType.CreateAndTransferSplToken:
        return this.buildCreateAndTransferSplToken(params);
      case ScriptArgumentType.Undelegate:
        return this.buildUndelegate(params);
      case ScriptArgumentType.DelegateAndCreateAccountWithSeed:
        return this.buildDelegateAndCreateAccountWithSeed(params);
      case ScriptArgumentType.StakingWithdraw:
        return this.buildStakingWithdraw(params);
      case ScriptArgumentType.Versioned:
        return this.buildVersioned(params);
      case ScriptArgumentType.SignIn:
        return this.buildSignIn(params);
      case ScriptArgumentType.SignMessage:
        return this.buildSignMessage(params);
    }
  }

  private buildTransfer({ transaction, fromPubkey, addressIndex }: TransferParams) {
    const rawTransaction = compileTransferTransaction({ ...transaction, fromPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getTransferArguments(transactionInstruction, addressIndex),
    };
  }

  private buildSplTokenTransfer({ transaction, fromPubkey, addressIndex, tokenInfo }: SplTokenTransferParams) {
    const rawTransaction = compileSplTokenTransaction({ ...transaction, signer: fromPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getSplTokenTransferArguments(transactionInstruction, addressIndex, tokenInfo),
    };
  }

  private buildCreateAndTransferSplToken({
    transaction,
    fromPubkey,
    addressIndex,
    tokenInfo,
  }: CreateAndTransferSplTokenParams) {
    const associateAccountInstruction = compileAssociateTokenAccount({
      ...transaction,
      signer: fromPubkey,
      owner: transaction.toPubkey,
      associateAccount: transaction.toTokenAccount,
      token: tokenInfo.address,
    });
    const transferInstructions = compileSplTokenTransaction({ ...transaction, signer: fromPubkey }).instructions;
    associateAccountInstruction.instructions.push(...transferInstructions);
    const transactionInstruction = new Transaction(associateAccountInstruction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getCreateAndTransferSPLToken(transactionInstruction, addressIndex, tokenInfo),
    };
  }

  private buildUndelegate({ transaction, fromPubkey, addressIndex }: UndelegateParams) {
    const rawTransaction = compileUndelegate({ ...transaction, feePayer: fromPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getUndelegateArguments(transactionInstruction, addressIndex),
    };
  }

  private buildDelegateAndCreateAccountWithSeed({
    transaction,
    fromPubkey,
    newAccountPubkey,
    addressIndex,
  }: DelegateAndCreateAccountParams) {
    const rawTransaction = compileDelegateAndCreateAccountWithSeed({
      ...transaction,
      fromPubkey,
      basePubkey: fromPubkey,
      newAccountPubkey,
    });
    const transactionInstruction = new Transaction(rawTransaction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getDelegateAndCreateAccountArguments(transactionInstruction, addressIndex),
    };
  }

  private buildStakingWithdraw({ transaction, fromPubkey, addressIndex }: StakingWithdrawParams) {
    const rawTransaction = compileStakingWithdraw({ ...transaction, authorizedPubkey: fromPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    return {
      transaction: transactionInstruction,
      argument: scriptUtil.getWithdrawArguments(transactionInstruction, addressIndex),
    };
  }

  private buildVersioned({ transaction, addressIndex }: VersionedParams) {
    return {
      transaction,
      argument: scriptUtil.getSignVersionedArguments(transaction, addressIndex),
    };
  }

  private buildSignIn({ message, addressIndex }: SignInParams) {
    return { argument: scriptUtil.getSignInArguments(message, addressIndex) };
  }

  private buildSignMessage({ message, addressIndex }: SignMessageParams) {
    return { argument: scriptUtil.getSignMessageArguments(message, addressIndex) };
  }
}
