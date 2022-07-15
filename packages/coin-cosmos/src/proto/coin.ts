import { Writer, Reader } from 'protobufjs/minimal';
import { Coin as CoinPb } from 'cosmjs-types/cosmos/base/v1beta1/coin';

class Coin {
  public readonly amount: string;
  constructor(public readonly denom: string, amount: string | number) {
    this.amount = '' + amount;
  }

  public toProto(): CoinPb {
    return CoinPb.fromPartial({ denom: this.denom, amount: this.amount });
  }

  public static encode(message: Coin, writer?: Writer): Writer {
    return CoinPb.encode(message, writer?.uint32(/* id 3, wireType 2 =*/ 26).fork()).ldelim();
  }

  public static decode(reader: Reader, length: number): Coin {
    const proto = CoinPb.decode(reader, length);
    return new Coin(proto.denom, proto.amount);
  }
}

export { Coin };
