import { transport } from '@coolwallet/core';

export type Transport = transport.default;

export type SignTxData = {
  transport: Transport,
  appPrivateKey: string,
  appId: string,
  addressIndex: number,
  confirmCB: () => void | undefined,
  authorizedCB: () => void | undefined
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