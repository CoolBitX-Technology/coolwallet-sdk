import { Writer, Reader } from 'protobufjs/minimal';
import isNil from 'lodash/isNil';
import { Coin } from './coin';

/**
 * ThorChain MsgSend encode their fromAddress and toAddress as `bytes`, which is different with cosmos.bank.
 *
 * Reference: https://gitlab.com/thorchain/thornode/-/blob/develop/proto/thorchain/v1/x/thorchain/types/msg_send.proto
 */
class ThorMsgSendPb {
  constructor(public fromAddress?: Uint8Array, public toAddress?: Uint8Array, public amount?: Coin[]) {}
  public static encode(message: ThorMsgSendPb, writer?: Writer) {
    if (!writer) writer = Writer.create();
    if (!isNil(message.fromAddress)) writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.fromAddress);
    if (!isNil(message.toAddress)) writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.toAddress);
    if (!isNil(message.amount) && message.amount.length) message.amount.forEach((c) => Coin.encode(c, writer));
    return writer;
  }

  public static decode(reader: Reader, length: number) {
    if (!(reader instanceof Reader)) reader = Reader.create(reader);
    const end = length === undefined ? reader.len : reader.pos + length,
      message = new ThorMsgSendPb();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fromAddress = reader.bytes();
          break;
        case 2:
          message.toAddress = reader.bytes();
          break;
        case 3:
          if (!(message.amount && message.amount.length)) message.amount = [];
          message.amount.push(Coin.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  public static fromPartial(params: {
    fromAddress?: Uint8Array;
    toAddress?: Uint8Array;
    amount?: Coin[];
  }): ThorMsgSendPb {
    return new ThorMsgSendPb(params.fromAddress, params.toAddress, params.amount);
  }

  public static fromJSON(params: { fromAddress?: Uint8Array; toAddress?: Uint8Array; amount?: Coin[] }): ThorMsgSendPb {
    return this.fromPartial(params);
  }
}

export { ThorMsgSendPb };
