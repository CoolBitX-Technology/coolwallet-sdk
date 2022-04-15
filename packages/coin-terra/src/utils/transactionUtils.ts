import {bech32} from 'bech32';
import * as cryptoUtil from './cryptoUtil'
import * as types from '../config/types'
import * as params from '../config/params'
const messages = require('../config/messages')

export function publicKeyToAddress(publicKey: string, prefix = "terra") {
  const publicKeyBuf = Buffer.from(publicKey, 'hex')
  const sha256Hash = cryptoUtil.sha256(publicKeyBuf);
  const ripemd160hash = cryptoUtil.ripemd160(sha256Hash)
  const words = bech32.toWords(ripemd160hash);
  return bech32.encode(prefix, words);
}

export const genTERRASigFromSESig = async (
  canonicalSignature: { r: string; s: string }
): Promise<string> => {
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return Buffer.from(r + s, 'hex').toString('base64');
};

export const getSendTx = (
  signData: types.MsgSend,
  signature: string,
  publicKey: string
): string => {
  const messageBuf = messages.MsgSend.encode({
    from_address: signData.fromAddress,
    to_address: signData.toAddress,
    amount: [{ denom: signData.denom.unit, amount: signData.amount.toString() }]
  })

  return getTxProtobuf(signData, signature, publicKey, params.TX_TYPE_URL.SEND, messageBuf);
}

export const getDelegateTx = (
  signData: types.MsgDelegate,
  signature: string,
  publicKey: string
): string => {
  const messageBuf = messages.MsgDelegate.encode({
    delegator_address: signData.delegatorAddress,
    validator_address: signData.validatorAddress,
    amount: { denom: signData.denom.unit, amount: signData.amount.toString() }
  });

  return getTxProtobuf(signData, signature, publicKey, params.TX_TYPE_URL.DELEGATE, messageBuf);
}

export const getUndelegateTx = (
  signData: types.MsgUndelegate,
  signature: string,
  publicKey: string
): string => {
  const messageBuf = messages.MsgUndelegate.encode({
    delegator_address: signData.delegatorAddress,
    validator_address: signData.validatorAddress,
    amount: { denom: signData.denom.unit, amount: signData.amount.toString() }
  });

  return getTxProtobuf(signData, signature, publicKey, params.TX_TYPE_URL.UNDELEGATE, messageBuf);
}

export const getWithdrawDelegatorRewardTx = (
  signData: types.MsgWithdrawDelegationReward,
  signature: string,
  publicKey: string
): string => {
  const messageBuf = messages.MsgUndelegate.encode({
    delegator_address: signData.delegatorAddress,
    validator_address: signData.validatorAddress,
  });

  return getTxProtobuf(signData, signature, publicKey, params.TX_TYPE_URL.WITHDRAW, messageBuf);
}

export const getSmartTx = (
  signData: types.MsgExecuteContract | types.MsgCW20,
  signature: string,
  publicKey: string
): string => {
  let funds = [];
  if(signData.funds !== undefined){
    funds.push({ denom: signData.funds.denom.unit, amount: signData.funds.amount.toString() });
  }
  const messageBuf = messages.MsgExecuteContract.encode({
    sender: signData.senderAddress,
    contract: signData.contractAddress,
    msg: JSON.stringify(signData.execute_msg),
    funds: funds
  })
  return getTxProtobuf(signData, signature, publicKey, params.TX_TYPE_URL.SMART, messageBuf);
}

export const getTxProtobuf = (
  signData: types.MsgSend | types.MsgDelegate | types.MsgUndelegate | types.MsgWithdrawDelegationReward | types.MsgExecuteContract | types.MsgCW20,
  signature: string,
  publicKey: string,
  type_url: string,
  msgValue: Buffer
): string => {


  const body_bytes = messages.TxBody.encode({
    messages: [
      {
        type_url: type_url,
        value: msgValue
      }
    ],
    memo: signData.memo
  });

  const publicKeyBuf = messages.PublicKey.encode({
    value: Buffer.from(publicKey, 'hex')
  });

  const publicKeyInfoBuf = messages.Any.encode({
    type_url: '/cosmos.crypto.secp256k1.PubKey',
    value: publicKeyBuf
  });

  const signerInfobuf = messages.SignerInfo.encode({
    public_key: publicKeyInfoBuf,
    mode_info:
      { single: { mode: messages.SignMode.SIGN_MODE_DIRECT } }
    ,
    sequence: signData.sequence
  });

  const feeBuf = messages.Fee.encode({ 
    amount: [{ 
      denom: signData.feeDenom === undefined ? 'uluna' : signData.feeDenom.unit, 
      amount: signData.feeAmount.toString() 
    }], 
    gas_limit: signData.gas.toString() 
  });
  
  const auth_info_bytes = messages.AuthInfo.encode({ signer_infos: [signerInfobuf], fee: feeBuf });

  const txRaw = messages.TxRaw.encode({
    body_bytes: body_bytes,
    auth_info_bytes: auth_info_bytes,
    signatures: [Buffer.from(signature, 'base64')],
  });
  return Buffer.from(txRaw,'hex').toString('hex');
}
