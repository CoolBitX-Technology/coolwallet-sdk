import { coin as COIN, error as ERROR, Transport, utils } from '@coolwallet/core';
import { PathType } from '@coolwallet/core/lib/config';
import * as types from './config/types';
import * as params from './config/params';
import * as stringUtil from './utils/stringUtil';
import * as scriptUtil from './utils/scriptUtil';
import { SCRIPT } from './config/params';
import * as sign from './sign';
import {
  compileAssociateTokenAccount,
  compileSplTokenTransaction,
  compileTransferTransaction,
  compileStakingWithdraw,
} from './utils/rawTransaction';
import * as txUtils from './utils/transactionUtils';
import Transaction from './utils/Transaction';

export { types };

export default class Solana extends COIN.EDDSACoin implements COIN.Coin {
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

  async signTransferTransaction(signTxData: types.signTransferTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const fromPubKey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = SCRIPT.TRANSFER.scriptWithSignature;
    const rawTransaction = compileTransferTransaction({ ...signTxData.transaction, fromPubKey });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getTransferArguments(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signTransferSplTokenTransaction(signTxData: types.signTransferSplTokenTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const signer = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = SCRIPT.SPL_TOKEN.scriptWithSignature;
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
    const script = SCRIPT.ASSOCIATED_TOKEN_ACCOUNT.scriptWithSignature;
    const rawTransaction = compileAssociateTokenAccount({ ...signTxData.transaction, signer });
    const transactionInstruction = new Transaction(rawTransaction);
    const argument = scriptUtil.getAssociateTokenAccount(transactionInstruction, addressIndex);

    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }

  async signStackingWithdrawTransaction(signTxData: types.signStakingWithdrawType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxData;
    const authorizedPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = SCRIPT.STAKING_WITHDRAW.scriptWithSignature;
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
    if (txUtils.isStakingWithdraw(signTxData))
      return this.signStackingWithdrawTransaction(signTxData as types.signStakingWithdrawType);

    // Blind signing
    const script = SCRIPT.SMART_CONTRACT.scriptWithSignature;
    const transactionInstruction = new Transaction(signTxData.transaction as types.TransactionArgs);
    const argument = scriptUtil.getSmartContractArguments(transactionInstruction, signTxData.addressIndex);
    return sign.signTransaction(signTxData, transactionInstruction, script, argument);
  }
}
