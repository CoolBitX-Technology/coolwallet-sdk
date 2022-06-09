/* eslint-disable no-param-reassign */
import { TezosToolkit } from '@taquito/taquito';
import { coin as COIN, config, Transport } from '@coolwallet/core';
import * as codecUtil from './utils/codecUtil';
import * as txUtil from './utils/transactionUtil';
import * as xtzUtil from './utils/xtzUtil';
import { PATH_STYLE } from './config/types';
import * as types from './config/types';
import * as params from './config/params';
import * as argUtil from './utils/argumentUtil';
import * as xtzSign from './sign';
import * as cryptoUtil from './utils/cryptoUtil';
import { TOKENTYPE } from './config/tokenType';
import * as paramUtil from './utils/parametersUtil';

export { PATH_STYLE };

export default class XTZ extends COIN.EDDSACoin implements COIN.Coin {

  pathStyle: PATH_STYLE;

  constructor(pathType: PATH_STYLE = PATH_STYLE.XTZ) {
    super(params.COIN_TYPE);
    this.pathStyle = pathType;
  }

  /**
   * Get Tezos (XTZ) public key with its default derivation path
   */
  async getPublicKeyByPathType(
    transport: Transport, appPrivateKey: string, appId: string, addressIndex = 0
  ) : Promise<string> {
    switch(this.pathStyle) {
      case PATH_STYLE.XTZ:
        const XTZPath = cryptoUtil.getXtzPath(config.PathType.SLIP0010.toString(), addressIndex);
        return COIN.getPublicKeyByPath(transport, appId, appPrivateKey, XTZPath);
      case PATH_STYLE.CWT:
      default:
        const pubKey = await this.getPublicKey(transport, appPrivateKey, appId, true);
        return pubKey;              
    }
  }

  async getPublicKeyHash(
    transport: Transport, appPrivateKey: string, appId: string, addressIndex = 0
  ): Promise<string> {
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);
    return codecUtil.pubKeyHexToStr(publicKey);
  }

  async getAddress(
    transport: Transport, appPrivateKey: string, appId: string, addressIndex = 0
  ): Promise<string> {
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);
    return codecUtil.pubKeyToAddress(publicKey);
  }

  async signTransaction(
    signTxData: types.SignTxData,
    operation: types.xtzTransaction
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.TRANSACTION.script + params.TRANSACTION.signature;
    const argument = await argUtil.getTransferTransactionArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatTransfer(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signReveal( 
    signTxData: types.SignTxData,
    operation: types.xtzReveal
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.REVEAL.script + params.REVEAL.signature;
    const argument = await argUtil.getRevealArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatReveal(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  // TBD
  async signOrigination(
    signTxData: types.SignTxData,
    operation: types.xtzOrigination
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script =  params.ORIGINATION.script + params.ORIGINATION.signature;
    const argument = await argUtil.getOriginationArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatOrigination(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signDelegation(
    signTxData: types.SignTxData,
    operation: types.xtzDelegation
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.DELEGATION.script + params.DELEGATION.signature;
    const argument = await argUtil.getDelegationArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatDelegation(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signUndelegation(
    signTxData: types.SignTxData,
    operation: types.xtzDelegation
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const script = params.UNDELEGATION.script + params.UNDELEGATION.signature;
    const argument = await argUtil.getUndelegationArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatUndelegation(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signSmartContract(
    signTxData: types.SignTxData,
    operation: types.xtzSmart
  ) {
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;

    const script = params.SMART.script + params.SMART.signature;
    const argument = await argUtil.getSmartArgument(this.pathStyle, operation, addressIndex);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatSmart(operation); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }

  async signTokenTransfer(
    signTxData: types.SignTxData,
    operation: types.xtzToken
  ){
    const {
      transport, appPrivateKey, appId, addressIndex
    } = signTxData;
    const { contractAddress, tokenId } = operation;
    const upperCaseAddress = contractAddress.toUpperCase();
    let tokenSignature = '';
    for (const tokenInfo of TOKENTYPE) {
      if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress && tokenInfo.token_id === tokenId) {
        tokenSignature = tokenInfo.signature;
        operation.tokenSymbol = tokenInfo.symbol;
        operation.tokenDecimals = tokenInfo.unit;
        break;
      }
    }
    const parameters = await paramUtil.getTokenParameters(operation);
    const script = params.TOKEN.script + params.TOKEN.signature;
    const argument = await argUtil.getTokenArgument(this.pathStyle, operation, addressIndex, parameters, tokenSignature);
    const publicKey = await this.getPublicKeyByPathType(transport, appPrivateKey, appId, addressIndex);

    const signature = await xtzSign.signTransaction(
      signTxData,
      script,
      argument,
      publicKey
    );
    const formatTxData = await xtzUtil.getFormatToken(operation, parameters); 
    return txUtil.getSubmitTransaction(formatTxData, signature);
  }
}
