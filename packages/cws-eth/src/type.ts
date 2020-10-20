import { transport } from '@coolwallet/core';

export type Output = {
  address: string,
  value: number
}

type Transport = transport.default;

export type signTx = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  transaction: Transaction,
  addressIndex: number,
  publicKey: string | undefined,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export type signMsg = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  message: string,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export type signTyped = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  typedData: any,
  addressIndex: number,
  confirmCB: Function | undefined,
  authorizedCB: Function | undefined
}

export type typedData = {
  type: 'object',
  properties: {
    types: {
      type: 'object',
      properties: {
        EIP712Domain: { type: 'array' },
      },
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' }
          },
          required: ['name', 'type']
        }
      },
      required: ['EIP712Domain']
    },
    primaryType: { type: 'string' },
    domain: { type: 'object' },
    message: { type: 'object' }
  },
  required: ['types', 'primaryType', 'domain', 'message']
};

export type Transaction = {
  // [key: string]: any,
  chainId: number,
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
  option: Option
}

export type Option = {
  transactionType: transactionType,
  info : {
    symbol: string,
    decimals: string
  }
};

export enum transactionType  {
  TRANSFER = "TRANSFER",
  ERC20 = "ERC20",
  SMART_CONTRACT = "SMART_CONTRACT",
};

export const coinType = '3C'

export const EIP712Schema = {
  type: 'object',
  properties: {
    types: {
      type: 'object',
      properties: {
        EIP712Domain: { type: 'array' },
      },
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' }
          },
          required: ['name', 'type']
        }
      },
      required: ['EIP712Domain']
    },
    primaryType: { type: 'string' },
    domain: { type: 'object' },
    message: { type: 'object' }
  },
  required: ['types', 'primaryType', 'domain', 'message']
}
