import { coin as COIN, Transport } from '@coolwallet/core';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtils';
import * as msgUtil from './utils/msgUtils';
import * as jsonUtil from './utils/jsonUtils';
import * as types from './config/types';
import { DENOMTYPE, DENOMTYPE_CLASSIC, DenomInfo } from './config/denomType';
import * as scriptUtil from './utils/scriptUtil';
import * as sign from './sign';
import {
  Coin,
  Msg,
  MsgDelegate,
  MsgExecuteContract,
  MsgSend,
  MsgUndelegate,
  MsgWithdrawDelegatorReward,
  TxBody,
} from './terra/@terra-core';
import { TOKENTYPE, TOKENTYPEDEV, TOKENTYPE_CLASSIC } from './config/tokenType';
import { COIN_TYPE } from './config/params';
import { handleHex } from './utils/stringUtils';

class Terra extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.publicKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.publicKeyToAddress(publicKey);
  }

  /**
   * Sign any type of transaction with the given payload.
   *
   * @param {types.SignMsgBlindType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signTransaction(signData: types.SignMsgBlindType): Promise<string> {
    const {
      transaction: { msgs, fee },
    } = signData;
    // CoolWallet Pro can only recognize single message payload.
    if (msgs.length === 1) {
      const msg = Msg.fromData(msgs[0]);
      // Check which kind of signing phrase should use.
      switch (msg.constructor) {
        case MsgSend: {
          const msgSendData = msgUtil.createMsgSend(signData, msg, fee);
          return this.signTransferTransaction(msgSendData);
        }
        case MsgDelegate: {
          const msgDelegateData = msgUtil.createMsgDelegate(signData, msg, fee);
          return this.signDelegateTransaction(msgDelegateData);
        }
        case MsgUndelegate: {
          const msgUndelegateData = msgUtil.createMsgUnDelegate(signData, msg, fee);
          return this.signUndelegateTransaction(msgUndelegateData);
        }
        case MsgWithdrawDelegatorReward: {
          const msgWithdrawData = msgUtil.createMsgWithdrawDelegatorReward(signData, msg, fee);
          return this.signWithdrawTransaction(msgWithdrawData);
        }
        case MsgExecuteContract: {
          const msgExecuteContract = msg as MsgExecuteContract;
          const execute_msg = jsonUtil.tryParseJson(msgExecuteContract.execute_msg);
          // if execute_msg contains transfer.amount and transfer.recipient.
          if (execute_msg.transfer?.amount && execute_msg.transfer?.recipient) {
            const msgCW20Data = msgUtil.createMsgCW20(signData, msg, fee);
            return this.signMsgCW20Transaction(msgCW20Data);
          }
          const msgExecuteContractData = msgUtil.createMsgExecuteContract(signData, msg, fee);
          return this.signMsgExecuteContractTransaction(msgExecuteContractData);
        }
        default:
          break;
      }
    }

    // If CoolWallet Pro cannot recognize this transaction, using sign blind transaction instead.
    return this.signBlindTransaction(signData);
  }

  /**
   * Sign single MsgSend transaction with denom and amount.
   *
   * @param {types.SignMsgSendType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signTransferTransaction(signData: types.SignMsgSendType): Promise<string> {
    const { addressIndex, transaction, appId, appPrivateKey, transport } = signData;
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.TRANSFER.script + params.TRANSFER.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.TRANSFER.script_classic + params.TRANSFER.signature_classic;
    else script = params.TRANSFER.script_test + params.TRANSFER.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getTerraSendArgument(publicKey, transaction, addressIndex);
    // Creating Cosmos Tx and assign signature
    const { coin } = transaction;
    const msgSend = new MsgSend(transaction.fromAddress, transaction.toAddress, `${coin.amount}${coin.denom.unit}`);
    return sign.signTransaction(signData, msgSend, script, argument, publicKey);
  }

  /**
   * Sign single MsgDelegate transaction with denom and amount.
   *
   * @param {types.SignMsgDelegateType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signDelegateTransaction(signData: types.SignMsgDelegateType): Promise<string> {
    const { transport, appId, appPrivateKey, addressIndex } = signData;
    const transaction = {
      ...signData.transaction,
      coin: {
        denom: DENOMTYPE.LUNA,
        amount: signData.transaction.coin.amount,
      },
    };
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.DELEGATE.script + params.DELEGATE.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.DELEGATE.script_classic + params.DELEGATE.signature_classic;
    else script = params.DELEGATE.script_test + params.DELEGATE.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getTerraStakingArgument(publicKey, transaction, addressIndex);
    const { coin } = transaction;
    const msgDelegate = new MsgDelegate(
      transaction.delegatorAddress,
      transaction.validatorAddress,
      new Coin(coin.denom.unit, coin.amount)
    );
    return sign.signTransaction(signData, msgDelegate, script, argument, publicKey);
  }

  /**
   * Sign single MsgUndelegate transaction with denom and amount.
   *
   * @param {types.SignMsgUndelegateType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signUndelegateTransaction(signData: types.SignMsgUndelegateType): Promise<string> {
    const { transport, appId, appPrivateKey, addressIndex } = signData;
    const transaction = {
      ...signData.transaction,
      coin: {
        denom: DENOMTYPE.LUNA,
        amount: signData.transaction.coin.amount,
      },
    };
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.UNDELEGATE.script + params.UNDELEGATE.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.UNDELEGATE.script_classic + params.UNDELEGATE.signature_classic;
    else script = params.UNDELEGATE.script_test + params.UNDELEGATE.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getTerraStakingArgument(publicKey, transaction, addressIndex);
    const { coin } = transaction;
    const msgDelegate = new MsgUndelegate(
      transaction.delegatorAddress,
      transaction.validatorAddress,
      new Coin(coin.denom.unit, coin.amount)
    );
    return sign.signTransaction(signData, msgDelegate, script, argument, publicKey);
  }

  /**
   * Sign single MsgWithdrawDelegatorReward transaction with denom and amount.
   *
   * @param {types.SignMsgWithdrawDelegatorRewardType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signWithdrawTransaction(signData: types.SignMsgWithdrawDelegatorRewardType): Promise<string> {
    const { transaction, transport, appId, appPrivateKey, addressIndex } = signData;
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.WITHDRAW.script + params.WITHDRAW.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.WITHDRAW.script_classic + params.WITHDRAW.signature_classic;
    else script = params.WITHDRAW.script_test + params.WITHDRAW.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getMsgWithdrawDelegatorRewardArgument(publicKey, transaction, addressIndex);
    const msgWithdraw = new MsgWithdrawDelegatorReward(transaction.delegatorAddress, transaction.validatorAddress);
    return sign.signTransaction(signData, msgWithdraw, script, argument, publicKey);
  }

  /**
   * Sign single MsgExecuteContract transaction with denom and amount.
   *
   * @param {types.SignMsgExecuteContractType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signMsgExecuteContractTransaction(signData: types.SignMsgExecuteContractType): Promise<string> {
    const {
      transaction: { execute_msg },
      transport,
      appId,
      appPrivateKey,
      addressIndex,
    } = signData;
    const transaction = {
      ...signData.transaction,
      execute_msg: jsonUtil.tryParseJson(execute_msg),
    };
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.SMART.script + params.SMART.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.SMART.script_classic + params.SMART.signature_classic;
    else script = params.SMART.script_test + params.SMART.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getTerraSmartArgument(publicKey, transaction, addressIndex);
    const funds = [];
    if (transaction.funds) {
      funds.push(new Coin(transaction.funds.denom.unit, transaction.funds.amount));
    }
    const msgExecuteContract = new MsgExecuteContract(
      transaction.senderAddress,
      transaction.contractAddress,
      transaction.execute_msg,
      funds
    );
    return sign.signTransaction(signData, msgExecuteContract, script, argument, publicKey);
  }

  /**
   * Sign single MsgExecuteContract transaction with specific executeMsg.
   *
   * @param {types.SignMsgCW20Type} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  async signMsgCW20Transaction(signData: types.SignMsgCW20Type): Promise<string> {
    const { transaction, transport, appId, appPrivateKey, addressIndex } = signData;
    const { contractAddress } = transaction;
    const upperCaseAddress = contractAddress.toUpperCase();
    // Find official support token signature
    let tokenSignature = '';
    for (const tokenInfo of TOKENTYPE) {
      // Assign symbol with contract Address
      if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress) {
        tokenSignature = tokenInfo.signature;
        signData.transaction.option = {
          info: {
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.unit,
          },
        };
        break;
      }
    }
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (transaction.chainId === types.CHAIN_ID.MAIN) script = params.CW20.script + params.CW20.signature;
    else if (transaction.chainId === types.CHAIN_ID.CLASSIC)
      script = params.CW20.script_classic + params.CW20.signature_classic;
    else script = params.CW20.script_test + params.CW20.signature_test;
    // Prepare script argument
    const argument = scriptUtil.getCW20Argument(publicKey, transaction, addressIndex, tokenSignature);
    const msgExecuteContract = new MsgExecuteContract(
      transaction.senderAddress,
      transaction.contractAddress,
      transaction.execute_msg
    );
    return sign.signTransaction(signData, msgExecuteContract, script, argument, publicKey);
  }

  /**
   * Sign any kind of  transaction with msgs and fee.
   *
   * @param {types.SignMsgBlindType} signData transaction and CoolWallet Pro essential data (ex. transport).
   * @returns {Promise<string>} rawTx in base64 format.
   */
  private async signBlindTransaction(signData: types.SignMsgBlindType): Promise<string> {
    const {
      transport,
      appId,
      appPrivateKey,
      addressIndex,
      transaction: { msgs, chainId, memo },
    } = signData;
    // Fetch PublicKey from SE
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    // Determine using testnet script or mainnet
    let script: string;
    if (chainId === types.CHAIN_ID.MAIN) script = params.BLIND.script + params.BLIND.signature;
    else if (chainId === types.CHAIN_ID.CLASSIC)
      script = params.BLIND.script_classic + params.BLIND.signature_classic;
    else script = params.BLIND.script_test + params.BLIND.signature_test;
    // Get TxBodyBytes
    const txBody = TxBody.fromData({ messages: msgs, memo });
    const txBodyHex = handleHex(Buffer.from(txBody.toBytes()).toString('hex'));
    const argument = scriptUtil.getMsgBlindArgument(publicKey, signData.transaction, addressIndex, txBodyHex);
    return sign.signSegmentTransaction(signData, txBodyHex, script, argument, publicKey);
  }
}

export { DENOMTYPE, DENOMTYPE_CLASSIC, TOKENTYPE, TOKENTYPEDEV, TOKENTYPE_CLASSIC, DenomInfo };
export * from './config/types';
export default Terra;
