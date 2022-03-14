import { Transport } from '@coolwallet/core';

interface BaseTransaction {
  transport: Transport;
  appPrivateKey: string;
  appId: string;
  addressIndex: number;
  publicKey?: string;
  confirmCB?(): void;
  authorizedCB?(): void;
}

type Option = {
  info: {
    symbol: string;
    decimals: string;
  };
};

interface LegacyTransaction extends BaseTransaction {
  transaction: {
    nonce: string;
    gasPrice: string;
    gasLimit: string;
    to: string;
    value: string;
    data: string;
    option?: Option;
  };
}

interface EIP1559Transaction extends BaseTransaction {
  transaction: {
    nonce: string;
    gasTipCap: string;
    gasFeeCap: string;
    gasLimit: string;
    to: string;
    value: string;
    data: string;
    option?: Option;
  };
}

interface EIP712TypedDataTransaction extends BaseTransaction {
  typedData: {
    types: {
      EIP712Domain: any[];
      [k: string]: {
        name: string;
        type: string;
        [k: string]: any;
      }[];
    };
    primaryType: string;
    domain: {
      [k: string]: any;
    };
    message: {
      [k: string]: any;
    };
    [k: string]: any;
  };
}

interface EIP712MessageTransaction extends BaseTransaction {
  message: string;
}

export {
  BaseTransaction,
  LegacyTransaction,
  EIP1559Transaction,
  EIP712TypedDataTransaction,
  EIP712MessageTransaction,
  Option,
};
