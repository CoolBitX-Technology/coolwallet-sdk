import { coin as COIN, error as ERROR, Transport, utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import { sha256 } from 'js-sha256';
import * as types from './config/types';
import * as params from './config/params';
import * as stringUtil from './utils/stringUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as sign from './sign';
import {
  compileAssociateTokenAccount,
  compileDelegate,
  compileDelegateAndCreateAccountWithSeed,
  compileSplTokenTransaction,
  compileTransferTransaction,
  compileUndelegate,
  compileStakingWithdraw,
} from './utils/rawTransaction';
import * as txUtils from './utils/transactionUtils';
import Transaction from './utils/Transaction';
import { SDKError } from '@coolwallet/core/lib/error';
import base58 from 'bs58';

class Solana extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    console.debug('Public Key:', publicKey);
    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return stringUtil.pubKeyToAddress(publicKey);
  }

  async createWithSeed(fromPublicKey: types.Address, seed: string, programId: types.Address): Promise<string> {
    const buffer = Buffer.concat([
      stringUtil.toBase58Buffer(fromPublicKey),
      Buffer.from(seed),
      stringUtil.toBase58Buffer(programId),
    ]);
    const hash = sha256.create();
    hash.update(buffer);
    return base58.encode(Buffer.from(hash.hex(), 'hex'));
  }

  async signTransferTransaction(signTxData: types.signTransferTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.TRANSFER.scriptWithSignature;
    const rawTransaction = compileTransferTransaction({ ...signTxData.transaction, fromPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getTransferArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signTransferSplTokenTransaction(signTxData: types.signTransferSplTokenTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const signer = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.SPL_TOKEN.scriptWithSignature;
    const rawTransaction = compileSplTokenTransaction({ ...signTxData.transaction, signer });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getSplTokenTransferArguments(
      transactionInstruction,
      addressIndex,
      rawTransaction.showTokenInfo
    );

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signAssociateTokenAccount(signTxData: types.signAssociateTokenAccountTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const signer = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.ASSOCIATED_TOKEN_ACCOUNT.scriptWithSignature;
    const rawTransaction = compileAssociateTokenAccount({ ...signTxData.transaction, signer });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getAssociateTokenAccount(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signDelegate(signTxData: types.signDelegateType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const feePayer = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.DELEGATE.scriptWithSignature;
    const rawTransaction = compileDelegate({ ...signTxData.transaction, feePayer });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getDelegateArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signUndelegate(signTxData: types.signUndelegateType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const feePayer = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.UNDELEGATE.scriptWithSignature;
    const rawTransaction = compileUndelegate({ ...signTxData.transaction, feePayer });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getUndelegateArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signDelegateAndCreateAccountWithSeed(
    signTxData: types.signDelegateAndCreateAccountWithSeedType
  ): Promise<string> {
    if (signTxData.transaction.seed.length > 64) {
      throw new SDKError(this.signDelegateAndCreateAccountWithSeed.name, 'seed length cannot be greater than 32 bytes');
    }
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.DELEGATE_AND_CREATE_ACCOUNT_WITH_SEED.scriptWithSignature;
    const rawTransaction = compileDelegateAndCreateAccountWithSeed({
      ...signTxData.transaction,
      fromPubkey,
      basePubkey: fromPubkey,
    });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getDelegateAndCreateAccountArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }
  
  async signStackingWithdrawTransaction(signTxData: types.signStakingWithdrawType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const authorizedPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.STAKING_WITHDRAW.scriptWithSignature;
    const rawTransaction = compileStakingWithdraw({ ...signTxData.transaction, authorizedPubkey });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getStackingWithdrawArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signTransaction(signTxData: types.signTxType): Promise<string> {
    // Specific which kind of transaction automatically
    if (txUtils.isTransfer(signTxData))
      return this.signTransferTransaction(signTxData as types.signTransferTransactionType);
    if (txUtils.isTransferSPLToken(signTxData))
      return this.signTransferSplTokenTransaction(signTxData as types.signTransferSplTokenTransactionType);
    if (txUtils.isAssociateTokenAccount(signTxData))
      return this.signAssociateTokenAccount(signTxData as types.signAssociateTokenAccountTransactionType);
    if (txUtils.isDelegate(signTxData)) return this.signDelegate(signTxData as types.signDelegateType);
    if (txUtils.isDelegateAndCreateAccountWithSeed(signTxData))
      return this.signDelegateAndCreateAccountWithSeed(signTxData as types.signDelegateAndCreateAccountWithSeedType);
    if (txUtils.isStakingWithdraw(signTxData))
      return this.signStackingWithdrawTransaction(signTxData as types.signStakingWithdrawType);

    // Blind signing
    const script = params.SCRIPT.SMART_CONTRACT.scriptWithSignature;
    const transactionInstruction = new Transaction(signTxData.transaction as types.TransactionArgs);
    const argument = scriptUtil.getSmartContractArguments(transactionInstruction, signTxData.addressIndex);
    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }
}

export { types };
export {
  LAMPORTS_PER_SOL,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  STAKE_PROGRAM_ID,
  STAKE_CONFIG_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
} from './config/params';
export default Solana;
