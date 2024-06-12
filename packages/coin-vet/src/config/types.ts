import { Transport } from '@coolwallet/core';

export type Integer = string | number;

export enum SignType {
  Transaction,
  Token,
  Certification
}

export type Param = TxParam | TokenParam | CertParam;

export type CoolWalletParam = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type Clause = {
  /**
   * destination address where transfer token to, or invoke contract method on.
   * set null destination to deploy a contract.
   */
  to: string | null;

  /** amount of token to transfer to the destination */
  value: Integer;

  /** input data for contract method invocation or deployment */
  data: string;
}

export type TxParam = {
  /** 8 bytes prefix of some block's ID */
  blockRef: string;
  /** constraint of time bucket */
  expiration: number;
  /** array of clauses */
  clauses: Clause[];
  /** coef applied to base gas price [0,255] */
  gasPriceCoef: number;
  /** max gas provided for execution */
  gas: number;
  /** ID of another tx that is depended */
  dependsOn: string;
  /** nonce value for various purposes */
  nonce: string;

  reserved?: {
    /** tx feature bits */
    features?: number;
    unused?: Buffer[];
  };
};

export type TokenParam = {
  blockRef: string;
  expiration: number;
  gasPriceCoef: number;
  gas: number;
  dependsOn: string;
  nonce: string;

  isVip191: boolean;

  contractAddress: string;
  recipient: string;
  value: Integer;
  symbol: string;
  decimals: number;
};

export type CertParam = {
  purpose: string;
  payload: {
    type: string;
    content: string;
  };

  domain: string;
  timestamp: number;
  signer: string;

  signature?: string;
}
