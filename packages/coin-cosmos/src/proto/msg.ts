import { MsgSend as MsgSendPb } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
// prettier-ignore
import {
  MsgWithdrawDelegatorReward as MsgWithdrawDelegatorRewardPb
} from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import { MsgDelegate as MsgDelegatePb, MsgUndelegate as MsgUndelegatePb } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { ThorMsgSendPb } from './primitive';
import { Coin } from './coin';
import { decodeBech32 } from '../utils/crypto';

class ThorMsgSend {
  constructor(public from_address: string, public to_address: string, public amount: Coin[]) {}

  public toProto(): ThorMsgSendPb {
    const { from_address, to_address, amount } = this;
    return ThorMsgSendPb.fromPartial({
      fromAddress: decodeBech32(from_address),
      toAddress: decodeBech32(to_address),
      amount: amount,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/types.MsgSend',
      value: ThorMsgSendPb.encode(this.toProto()).finish(),
    });
  }
}

class MsgSend {
  constructor(public from_address: string, public to_address: string, public amount: Coin[]) {}

  public toProto(): MsgSendPb {
    const { from_address, to_address, amount } = this;
    return MsgSendPb.fromPartial({
      fromAddress: from_address,
      toAddress: to_address,
      amount: amount.map((a) => a.toProto()),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSendPb.encode(this.toProto()).finish(),
    });
  }
}

class MsgDelegate {
  constructor(public delegator_address: string, public validator_address: string, public amount: Coin) {}

  public toProto(): MsgDelegatePb {
    const { delegator_address, validator_address, amount } = this;
    return MsgDelegatePb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: MsgDelegatePb.encode(this.toProto()).finish(),
    });
  }
}

class MsgUndelegate {
  constructor(public delegator_address: string, public validator_address: string, public amount: Coin) {}

  public toProto(): MsgUndelegatePb {
    const { delegator_address, validator_address, amount } = this;
    return MsgUndelegatePb.fromPartial({
      amount: amount.toProto(),
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
      value: MsgUndelegatePb.encode(this.toProto()).finish(),
    });
  }
}

class MsgWithdrawDelegatorReward {
  constructor(public delegator_address: string, public validator_address: string) {}

  public toProto(): MsgWithdrawDelegatorRewardPb {
    const { delegator_address, validator_address } = this;
    return MsgWithdrawDelegatorRewardPb.fromPartial({
      delegatorAddress: delegator_address,
      validatorAddress: validator_address,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: MsgWithdrawDelegatorRewardPb.encode(this.toProto()).finish(),
    });
  }
}

type Msg = MsgSend | ThorMsgSend | MsgDelegate | MsgUndelegate | MsgWithdrawDelegatorReward;

export { Msg, MsgSend, ThorMsgSendPb, ThorMsgSend, MsgDelegate, MsgUndelegate, MsgWithdrawDelegatorReward };
