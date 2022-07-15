import {
  coins,
  DirectSecp256k1HdWallet,
  EncodeObject,
  GeneratedType,
  makeAuthInfoBytes,
  makeSignDoc,
  Registry,
  TxBodyEncodeObject,
} from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { MsgDelegate, MsgUndelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import { ChainProps, CHAIN } from '../src';
import { TransactionMandatory } from './types';
import { ThorMsgSendPb } from '../src/proto/msg';

class CosmosWallet {
  private register: Registry;
  constructor(private chain: ChainProps, private signer: DirectSecp256k1HdWallet) {
    this.register = new Registry();
    this.register.register('/types.MsgSend', ThorMsgSendPb as unknown as GeneratedType);
    this.register.register('/cosmos.staking.v1beta1.MsgDelegate', MsgDelegate);
    this.register.register('/cosmos.staking.v1beta1.MsgUndelegate', MsgUndelegate);
    this.register.register('/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward', MsgWithdrawDelegatorReward);
  }

  static async new(chain: ChainProps, mnemonic: string): Promise<CosmosWallet> {
    const HIGHEST_BIT = 0x80000000;
    const coin_type = Buffer.from(chain.getCoinType(), 'hex').readUInt32BE(0) - HIGHEST_BIT;
    const path = `m/44'/${coin_type}'/0'/0/0`;
    const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [stringToPath(path)],
      prefix: chain.getPrefix(),
    });
    return new CosmosWallet(chain, signer);
  }

  async getAccount(index = 0) {
    const accounts = await this.signer.getAccounts();
    return accounts[index];
  }

  async sign(msgs: readonly EncodeObject[], test: TransactionMandatory): Promise<string> {
    const from = await this.getAccount();
    const pubkeyProto = PubKey.fromPartial({
      key: from.pubkey,
    });
    const pubkey = Any.fromPartial({
      typeUrl: '/cosmos.crypto.secp256k1.PubKey',
      value: Uint8Array.from(PubKey.encode(pubkeyProto).finish()),
    });
    let fee_amounts = coins(test.fee.amount, test.fee.denom);
    //  ThorChain does not have fee.amount<Coin>.
    if (this.chain.isChainId(CHAIN.THOR.getChainId())) {
      fee_amounts = [];
    }
    const authInfo = makeAuthInfoBytes([{ pubkey, sequence: test.sequence }], fee_amounts, test.fee.gas_limit);
    const txBody: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: msgs,
        memo: test.memo,
      },
    };
    const signDoc = makeSignDoc(this.register.encode(txBody), authInfo, this.chain.getChainId(), test.account_number);
    const { signature, signed } = await this.signer.signDirect(from.address, signDoc);
    const txRaw = TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [Buffer.from(signature.signature, 'base64')],
    });
    return Buffer.from(TxRaw.encode(txRaw).finish()).toString('hex');
  }
}

export { CosmosWallet };
