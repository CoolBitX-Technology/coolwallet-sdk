type AccAddress = string;
type ValAddress = string;
type Denom = string;

class Any {
  typeUrl: string;
  value: Uint8Array;
}

export class Coins {
  public denoms(): Denom[];
  public get(denom: Denom): Coin;
}

export class Coin {
  constructor(public readonly denom: Denom, amount: number);
  denom: Denom;
  amount: string;
}

export class SimplePublicKey {
  key: string;
  constructor(key: string);
  public address(): string;
  public pubkeyAddress(): string;
  packAny: Any;
}

export class Msg {
  public static fromData(data: any): Msg;
  packAny(): Any;
}

export class MsgSend extends Msg {
  constructor(public from_address: AccAddress, public to_address: AccAddress, public amount: string | Coin[] | Coins);
}

export class MsgExecuteContract extends Msg {
  constructor(
    public sender: AccAddress,
    public contract: AccAddress,
    public execute_msg: object | string,
    coins: string | Coin[] | Coins = {}
  );
  public coins: Coins;
}

export class MsgDelegate extends Msg {
  constructor(public delegator_address: AccAddress, public validator_address: ValAddress, public amount: Coin);
}

export class MsgUndelegate extends Msg {
  constructor(public delegator_address: AccAddress, public validator_address: ValAddress, public amount: Coin);
}

export class MsgWithdrawDelegatorReward extends Msg {
  constructor(public delegator_address: AccAddress, public validator_address: ValAddress);
}

export class ModeInfo {
  static SignMode: {
    '0': 'SIGN_MODE_UNSPECIFIED';
    '1': 'SIGN_MODE_DIRECT';
    '2': 'SIGN_MODE_TEXTUAL';
    '127': 'SIGN_MODE_LEGACY_AMINO_JSON';
    SIGN_MODE_UNSPECIFIED: 0;
    SIGN_MODE_DIRECT: 1;
    SIGN_MODE_TEXTUAL: 2;
    SIGN_MODE_LEGACY_AMINO_JSON: 127;
    UNRECOGNIZED: -1;
    '-1': 'UNRECOGNIZED';
  };
  constructor(mode_info: ModeInfo.Single | ModeInfo.Multi);
}

export namespace ModeInfo {
  export class Single {
    constructor(public mode: SignMode) {}
  }
}

export class SignerInfo {
  constructor(public public_key: SimplePublicKey, public sequence: number, public mode_info: ModeInfo);
}

export namespace Fee {
  export interface Data {
    gas_limit: string;
    payer?: string;
    granter?: string;
    amount: Coins.Data;
  }
}

export class Fee {
  constructor(
    public readonly gas_limit: number,
    amount: string | Coin[],
    public payer?: AccAddress,
    public granter?: AccAddress
  );
  public static fromData(data: Fee.Data): Fee;
}

export class AuthInfo {
  constructor(public signer_infos: SignerInfo[], public fee: Fee) {}
  public toBytes(): Uint8Array;
}

export namespace TxBody {
  export interface Data {
    messages: Msg.Data[];
    memo?: string;
    timeout_height?: string;
  }
}

export class SignDoc {
  constructor(
    public chain_id: string,
    public account_number: number,
    public sequence: number,
    public auth_info: AuthInfo,
    public tx_body: TxBody
  );
  public toBytes(): Uint8Array;
}

export class TxBody {
  constructor(public messages: Msg[], public memo?: string, public timeout_height?: number);
  public static fromData(data: TxBody.Data): TxBody;
  public toBytes(): Uint8Array;
}

export class Tx {
  constructor(public body: TxBody, public auth_info: AuthInfo, public signatures: string[]);
  public toBytes(): Uint8Array;
}
