import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import isNil from 'lodash/isNil';
import {
  Tx as TxPb,
  TxBody as TxBodyPb,
  AuthInfo as AuthInfoPb,
  ModeInfo as ModeInfoPb,
  SignerInfo as SignerInfoPb,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { PubKey as PubKeyPb } from 'cosmjs-types/cosmos/crypto/secp256k1/keys';
import { Fee as FeePb } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { Msg } from './msg';
import { Coin } from './coin';

class PublicKey {
  constructor(public key: string) {}

  public toProto(): PubKeyPb {
    return PubKeyPb.fromPartial({
      key: Buffer.from(this.key, 'hex'),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.crypto.secp256k1.PubKey',
      value: PubKeyPb.encode(this.toProto()).finish(),
    });
  }
}

class ModeInfo {
  public toProto(): ModeInfoPb {
    return ModeInfoPb.fromPartial({
      single: { mode: SignMode.SIGN_MODE_DIRECT },
    });
  }
}

export class SignerInfo {
  constructor(public public_key: string, public sequence: number) {}

  public toProto(): SignerInfoPb {
    const { public_key, sequence } = this;
    return SignerInfoPb.fromPartial({
      modeInfo: new ModeInfo().toProto(),
      publicKey: new PublicKey(public_key).packAny(),
      sequence: sequence,
    });
  }
}

class Fee {
  constructor(
    public readonly gas_limit: number,
    public amount: Coin[],
    public payer?: string,
    public granter?: string
  ) {}

  public toProto(): FeePb {
    const { amount, gas_limit, payer, granter } = this;
    return FeePb.fromPartial({
      amount: amount.map((a) => a.toProto()),
      gasLimit: gas_limit,
      granter,
      payer,
    });
  }
}

class AuthInfo {
  constructor(public signer_infos: SignerInfo[], public fee: Fee) {}

  public toProto(): AuthInfoPb {
    return AuthInfoPb.fromPartial({
      fee: this.fee.toProto(),
      signerInfos: this.signer_infos.map((info) => info.toProto()),
    });
  }

  public toBytes(): Uint8Array {
    return AuthInfoPb.encode(this.toProto()).finish();
  }
}

class TxBody {
  constructor(public messages: Msg[], public memo?: string, public timeout_height?: number) {}
  public toProto(): TxBodyPb {
    return TxBodyPb.fromPartial({
      memo: this.memo,
      messages: this.messages.map((m) => m.packAny()),
      timeoutHeight: this.timeout_height ?? 0,
    });
  }

  public toBytes(): Uint8Array {
    return TxBodyPb.encode(this.toProto()).finish();
  }
}

class Tx {
  constructor(
    public messages: Msg[],
    public public_key: string,
    public sequence: number,
    public gas_limit: number,
    public fee_amount: Coin[],
    public memo?: string,
    public signature?: string
  ) {}

  public toProto(): TxPb {
    const body = new TxBody(this.messages, this.memo);
    const signer_infos = new SignerInfo(this.public_key, this.sequence);
    const fee = new Fee(this.gas_limit, this.fee_amount);
    const auth_info = new AuthInfo([signer_infos], fee);
    return TxPb.fromPartial({
      body: body.toProto(),
      authInfo: auth_info.toProto(),
      signatures: isNil(this.signature) ? undefined : [Buffer.from(this.signature, 'hex')],
    });
  }

  public toBytes(): Uint8Array {
    return TxPb.encode(this.toProto()).finish();
  }
}

export { Tx };
