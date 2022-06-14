import { Transport } from '@coolwallet/core';

export { Transport };

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
  chainTag: number;
  /** 8 bytes prefix of some block's ID */
  blockRef: string;
  /** constraint of time bucket */
  expiration: number;
  /** array of clauses */
  clauses: Clause[];
  /** coef applied to base gas price [0,255] */
  gasPriceCoef: number;
  /** max gas provided for execution */
  gas: string | number;
  /** ID of another tx that is depended */
  dependsOn: string | null;
  /** nonce value for various purposes */
  nonce: string | number;

  reserved?: {
    /** tx feature bits */
    features?: number;
    unused?: Buffer[];
  };
}

export type signTxType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Record<string, any>;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};

export type signCertType = {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  transaction: Record<string, any>;
  addressIndex: number;
  confirmCB?(): void;
  authorizedCB?(): void;
};


