import { SDKError } from '@coolwallet/core/lib/error';
import { DenomInfo, DENOMTYPE, DENOMTYPE_CLASSIC } from '../config/denomType';
import * as types from '../config/types';
import {
  Coins,
  Msg,
  MsgDelegate,
  MsgExecuteContract,
  MsgSend,
  MsgUndelegate,
  MsgWithdrawDelegatorReward,
} from '../terra/@terra-core';

function denomFromUnit(unit: string, name: string): DenomInfo {
  let feeDenom = Object.values(DENOMTYPE).find((d) => d.unit === unit);
  if (!feeDenom) feeDenom = Object.values(DENOMTYPE_CLASSIC).find((d) => d.unit === unit);
  if (!feeDenom) throw new SDKError(name, 'Cannot find given fee denom');
  return feeDenom;
}

function getDenomFromFee(fee: types.MsgBlind['fee'], name: string): DenomInfo {
  const feeDenom = denomFromUnit(fee.amount[0].denom, name);
  return feeDenom;
}

function createMsgSend(signData: types.SignMsgBlindType, msg: Msg, fee: types.MsgBlind['fee']): types.SignMsgSendType {
  const msgSend = msg as MsgSend;
  const coin = msgSend.amount as Coins;
  const [denom] = coin.denoms();
  const coinDenom = denomFromUnit(denom, createMsgSend.name);
  const feeDenom = getDenomFromFee(fee, 'createMsgSend');
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      fromAddress: msgSend.from_address,
      toAddress: msgSend.to_address,
      coin: {
        denom: coinDenom,
        amount: +coin.get(denom).amount,
      },
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

function createMsgDelegate(
  signData: types.SignMsgBlindType,
  msg: Msg,
  fee: types.MsgBlind['fee']
): types.SignMsgDelegateType {
  const msgDelegate = msg as MsgDelegate;
  const coin = msgDelegate.amount;
  const coinDenom = denomFromUnit(coin.denom, createMsgDelegate.name);
  const feeDenom = getDenomFromFee(fee, 'createMsgDelegate');
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      delegatorAddress: msgDelegate.delegator_address,
      validatorAddress: msgDelegate.validator_address,
      coin: {
        denom: coinDenom,
        amount: +coin.amount,
      },
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

function createMsgUnDelegate(
  signData: types.SignMsgBlindType,
  msg: Msg,
  fee: types.MsgBlind['fee']
): types.SignMsgUndelegateType {
  const msgUndelegate = msg as MsgUndelegate;
  const coin = msgUndelegate.amount;
  const feeDenom = getDenomFromFee(fee, 'createMsgUnDelegate');
  const coinDenom = denomFromUnit(coin.denom, createMsgUnDelegate.name);
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      delegatorAddress: msgUndelegate.delegator_address,
      validatorAddress: msgUndelegate.validator_address,
      coin: {
        denom: coinDenom,
        amount: +coin.amount,
      },
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

function createMsgWithdrawDelegatorReward(
  signData: types.SignMsgBlindType,
  msg: Msg,
  fee: types.MsgBlind['fee']
): types.SignMsgWithdrawDelegatorRewardType {
  const msgWithdraw = msg as MsgWithdrawDelegatorReward;
  const feeDenom = getDenomFromFee(fee, 'createMsgWithdrawDelegatorReward');
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      delegatorAddress: msgWithdraw.delegator_address,
      validatorAddress: msgWithdraw.validator_address,
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

function createMsgExecuteContract(
  signData: types.SignMsgBlindType,
  msg: Msg,
  fee: types.MsgBlind['fee']
): types.SignMsgExecuteContractType {
  const msgExecuteContract = msg as MsgExecuteContract;
  const feeDenom = getDenomFromFee(fee, 'createMsgExecuteContract');
  const fundsDenom = msgExecuteContract.coins.denoms();
  if (fundsDenom.length > 1)
    throw new SDKError(createMsgExecuteContract.name, 'Cannot support multiple denom when signing MsgExecuteContract.');
  let funds;
  if (fundsDenom[0]) {
    const fundDenom = denomFromUnit(fundsDenom[0], createMsgExecuteContract.name);
    funds = {
      denom: fundDenom,
      amount: +msgExecuteContract.coins.get(fundsDenom[0]).amount,
    };
  }
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      senderAddress: msgExecuteContract.sender,
      contractAddress: msgExecuteContract.contract,
      execute_msg: msgExecuteContract.execute_msg,
      funds,
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

function createMsgCW20(signData: types.SignMsgBlindType, msg: Msg, fee: types.MsgBlind['fee']): types.SignMsgCW20Type {
  const msgExecuteContract = msg as MsgExecuteContract;
  const feeDenom = getDenomFromFee(fee, 'createMsgCW20');
  const execute_msg = msgExecuteContract.execute_msg as types.MsgCW20['execute_msg'];
  return {
    ...signData,
    transaction: {
      ...signData.transaction,
      memo: signData.transaction.memo ?? '',
      senderAddress: msgExecuteContract.sender,
      contractAddress: msgExecuteContract.contract,
      execute_msg,
      fee: {
        gas_limit: +fee.gas_limit,
        denom: feeDenom,
        amount: +fee?.amount[0].amount,
      },
    },
  };
}

export {
  getDenomFromFee,
  createMsgSend,
  createMsgDelegate,
  createMsgUnDelegate,
  createMsgWithdrawDelegatorReward,
  createMsgExecuteContract,
  createMsgCW20,
};
