import * as types from '../config/types';
import { hexString } from '../config/types';
import * as forger from '@taquito/local-forging'
import { ForgeParams, OpKind } from "@taquito/taquito";

export async function getFormatReveal(rawData: types.xtzReveal): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.REVEAL,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        public_key: rawData.public_key
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatTransfer(rawData: types.xtzTransaction): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.TRANSACTION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        amount: rawData.amount,
        destination: rawData.destination
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatOrigination(rawData: types.xtzOrigination): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.ORIGINATION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        balance: rawData.balance
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatDelegation(rawData: types.xtzDelegation): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.DELEGATION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        delegate: rawData.delegate
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatUndelegation(rawData: types.xtzDelegation): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.DELEGATION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatSmart(rawData: types.xtzSmart): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.TRANSACTION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        amount: rawData.amount,
        destination: rawData.destination,
        parameters: {
          entrypoint: rawData.parameters.entrypoint,
          value: rawData.parameters.value
        }
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}

export async function getFormatToken(rawData: types.xtzToken, param: any): Promise<hexString> {
  let tx: ForgeParams = {
    branch: rawData.branch,
    contents: [
      {
        kind: OpKind.TRANSACTION,
        source: rawData.source,
        counter: rawData.counter,
        fee: rawData.fee,
        gas_limit: rawData.gas_limit,
        storage_limit: rawData.storage_limit,
        amount: '0',
        destination: rawData.contractAddress,
        parameters: param
      }
    ]
  }; 
  const rawTx = await forger.localForger.forge(tx);
  return rawTx;
}