import { coin as COIN, Transport } from '@coolwallet/core';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtils';
import * as types from './config/types';
import { DENOMTYPE } from './config/denomType';
import { SDKError } from '@coolwallet/core/lib/error';
import * as scriptUtil from './utils/scriptUtil';
import * as sign from './sign';
import { TOKENTYPE, TOKENTYPEDEV } from './config/tokenType';

export default class TERRA extends COIN.ECDSACoin implements COIN.Coin{
  public Types: any;

  constructor(){
    super(params.COIN_TYPE);
    this.Types = types;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string>{
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return txUtil.publicKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return txUtil.publicKeyToAddress(publicKey);
  }

  async signTransaction(signData: types.SignDataType): Promise<string> {
    const chainId = signData.transaction.chainId;
    switch (chainId) {
      case types.CHAIN_ID.MAIN:
      case types.CHAIN_ID.TEST:
        return this.signTERRATransaction(signData);
      default:
        throw new SDKError(this.signTransaction.name, `not support input chainId: ${chainId}`);
    }
  }

  async signTERRATransaction(signData: types.SignDataType): Promise<string> {
    const { addressIndex } = signData;

    const publicKey = await this.getPublicKey(signData.transport, signData.appPrivateKey, signData.appId, addressIndex);

    let script;
    let argument;
    let genTx;
    switch (signData.txType) {
      case types.TX_TYPE.SEND:
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.TRANSFER.script + params.TRANSFER.signature;
        else
          script = params.TRANSFER.script_test + params.TRANSFER.signature_test;
        argument = scriptUtil.getTerraSendArgement(publicKey, signData.transaction, addressIndex);
        genTx = (signature: string) => {
          return txUtil.getSendTx(signData.transaction, signature, publicKey);
        };
        break;
      case types.TX_TYPE.DELEGATE:
        signData.transaction.denom = DENOMTYPE.LUNA;
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.DELEGATE.script + params.DELEGATE.signature;
        else
          script = params.DELEGATE.script_test + params.DELEGATE.signature_test;
        argument = scriptUtil.getTerraDelgtOrUnDelArgement(publicKey, signData.transaction, addressIndex);
        genTx = (signature: string) => {
          return txUtil.getDelegateTx(signData.transaction, signature, publicKey);
        };
        break;
      case types.TX_TYPE.UNDELEGATE:
        signData.transaction.denom = DENOMTYPE.LUNA;
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.UNDELEGATE.script + params.UNDELEGATE.signature;
        else
          script = params.UNDELEGATE.script_test + params.UNDELEGATE.signature_test;
        argument = scriptUtil.getTerraDelgtOrUnDelArgement(publicKey, signData.transaction, addressIndex);
        genTx = (signature: string) => {
          return txUtil.getUndelegateTx(signData.transaction, signature, publicKey);
        };
        break;
      case types.TX_TYPE.WITHDRAW:
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.WITHDRAW.script + params.WITHDRAW.signature;
        else
          script = params.WITHDRAW.script_test + params.WITHDRAW.signature_test;
        argument = scriptUtil.getTerraWithdrawArgement(publicKey, signData.transaction, addressIndex);
        genTx = (signature: string) => {
          return txUtil.getWithdrawDelegatorRewardTx(signData.transaction, signature, publicKey);
        };
        break;
      case types.TX_TYPE.CW20:
        const upperCaseAddress = signData.transaction.contractAddress.toUpperCase();
        let tokenSignature = '';
        let tokentype = TOKENTYPE;
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.CW20.script + params.CW20.signature;
        else{
          script = params.CW20.script_test + params.CW20.signature_test;
          tokentype = TOKENTYPEDEV
        }
        for(const tokenInfo of tokentype){
          // supported cw-20
          if (tokenInfo.contractAddress.toUpperCase() === upperCaseAddress) {
            tokenSignature = tokenInfo.signature;
            signData.transaction.option.info.symbol = tokenInfo.symbol;
            signData.transaction.option.info.decimals = tokenInfo.unit;
            break;
          }
        }
        argument = scriptUtil.getCW20Argument(publicKey, signData.transaction, addressIndex, tokenSignature);
        genTx = (signature: string) => {
          return txUtil.getSmartTx(signData.transaction, signature, publicKey);
        };
        break;
      case types.TX_TYPE.SMART:
        if(signData.transaction.chainId === types.CHAIN_ID.MAIN)
          script = params.SMART.script + params.SMART.signature;
        else
          script = params.SMART.script_test + params.SMART.signature_test;
        argument = scriptUtil.getTerraSmartArgument(publicKey, signData.transaction, addressIndex);
        genTx = (signature: string) => {
          return txUtil.getSmartTx(signData.transaction, signature, publicKey);
        }
        break;
      default:
        throw new SDKError(this.signTERRATransaction.name, `not support input tx type`);
    }
    const signature = await sign.signTransaction(signData, script, argument);
    console.debug('signature: ', signature);
    const signTx = genTx(signature);
    console.debug('signTx protobuf: ', signTx);
    const txBytesBase64 = Buffer.from(signTx, 'hex').toString('base64');
    return txBytesBase64;
  }
}