import * as stringUtil from "./stringUtil";
//import BN from 'bn.js';
import * as types from '../config/types';
import * as params from '../config/params';
import { SDKError } from "@coolwallet/core/lib/error";
import * as forger from '@taquito/local-forging'
import { ForgeParams, OpKind } from "@taquito/taquito";

export function getFormatReveal(rawData: types.xtzReveal): any {
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
  return forger.localForger.forge(tx);
}

export function getFormatTransfer(rawData: types.xtzTransaction): any {
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
  return forger.localForger.forge(tx);
}

export function getFormatOrigination(rawData: types.xtzOrigination): any {
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
  return forger.localForger.forge(tx);
}

export function getFormatDelegation(rawData: types.xtzDelegation): any {
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
  return forger.localForger.forge(tx);
}

export function getFormatUndelegation(rawData: types.xtzDelegation): any {
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
  return forger.localForger.forge(tx);
}