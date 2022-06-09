import { Transport } from '@coolwallet/core';
import { MichelsonData } from '@taquito/michel-codec';

export type transport = Transport;

export type hexString = string;

export enum PATH_STYLE {
  CWT = 'CWT', XTZ = 'XTZ'
}

export type SignTxData = {
  transport: transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  confirmCB?: () => void,
  authorizedCB?: () => void
}

export type formatTxData = {
  branch: string,
  contents: {[key: string]: any}[]
}

export type xtzOperation = {
  branch: string,
  source: string,
  fee: string,
  counter: string,
  gas_limit: string,
  storage_limit: string,
}

export interface xtzTransaction extends xtzOperation {
  amount: string,
  destination: string,
  // for smart contract interaction
  parameters?: string
}

export interface xtzReveal extends xtzOperation {
  public_key: string
}

// TBD
export interface xtzOrigination extends xtzOperation {
  balance: string,
  // False if script is set to deplopy smart contract, True otherwise
  delegatable?: boolean,
  // pubkey of delegate account is required to delegate
  delegate?: string,
  // smart contract code is reuqired to deploy smart contract
  script?: string
}

export interface xtzDelegation extends xtzOperation {
  // With, override the previous delegate account
  // Without, undelegate
  delegate?: string
}

export interface xtzSmart extends xtzOperation {
  amount: string,
  destination: string,
  parameters: smartParam;
}

export interface smartParam {
  entrypoint: string,
  value: MichelsonData
}

export interface xtzToken extends xtzOperation {
  tokenAmount: string, 
  contractAddress: string,
  toAddress: string,
  tokenId: string,
  tokenSymbol?: string,
  tokenDecimals?: string
}
