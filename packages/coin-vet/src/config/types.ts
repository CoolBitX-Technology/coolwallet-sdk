import { Transport } from '@coolwallet/core';

export type Clause = {
  /**
   * destination address where transfer token to, or invoke contract method on.
   * set null destination to deploy a contract.
   */
  to: string | null;

  /** amount of token to transfer to the destination */
  value: string | number;

  /** input data for contract method invocation or deployment */
  data: string;
}

export type Record = {
  /** last byte of genesis block ID */
  chainTag: string;
  /** 8 bytes prefix of some block's ID */
  blockRef: string;
  /** constraint of time bucket */
  expiration: string;
  /** array of clauses */
  clauses: Clause[];
  /** coef applied to base gas price [0,255] */
  gasPriceCoef: string;
  /** max gas provided for execution */
  gas: string;
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

export type DelegatorRecord = {
  /** last byte of genesis block ID */
  chainTag: string;
  /** 8 bytes prefix of some block's ID */
  blockRef: string;
  /** constraint of time bucket */
  expiration: string;
  /** array of clauses */
  clauses: Clause[];
  /** coef applied to base gas price [0,255] */
  gasPriceCoef: string;
  /** max gas provided for execution */
  gas: string;
  /** ID of another tx that is depended */
  dependsOn: string;
  /** nonce value for various purposes */
  nonce: string;

  reserved?: {
    /** tx feature bits */
    features?: number;
    unused?: Buffer[];
  };

  delegatorFor: string;
};

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Record;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type signDelegatorTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: DelegatorRecord;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type Certificate = {
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

export type signCertType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  certificate: Certificate;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};


