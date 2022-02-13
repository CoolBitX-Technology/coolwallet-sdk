import * as types from '../config/types'
import { utils } from '@coolwallet/core';
import * as params from '../config/params'
import * as stringUtil from './stringUtil'
import * as codec from '../utils/codecUtil'

export const getTransferTransactionArgument = async (rawData: types.xtzTransaction)
 : Promise<string> => {
   const branch = stringUtil.handleHex(codec.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codec.addressHashToHex(rawData.source).substring(2).padStart(42, '0');
   const fee = parseInt(rawData.fee).toString(16).padStart(10, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(10, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(10, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(10, '0');
   const amount = parseInt(rawData.amount).toString(16).padStart(10, '0');
   const destination = codec.addressHashToHex(rawData.destination);

   const  argument = branch + source + fee + counter + gas_limit + storage_limit + amount + destination;
   return argument;
};

export const getRevealArgument = async (rawData: types.xtzReveal)
 : Promise<string> => {
   const branch = stringUtil.handleHex(codec.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codec.addressHashToHex(rawData.source).substring(2).padStart(42, '0');
   const fee = parseInt(rawData.fee).toString(16).padStart(10, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(10, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(10, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(10, '0');
   const public_key = codec.pubKeyHashToHex(rawData.public_key).padStart(66,'0');
   
   const argument = branch + source + fee + counter + gas_limit + storage_limit + public_key;
   return argument;
};

// TBD
export const getOriginationArgument = async (rawData: types.xtzOrigination)
 : Promise<string> => {
  const branch = stringUtil.handleHex(codec.branchHashToHex(rawData.branch)).padStart(64, '0');
  const source  = codec.addressHashToHex(rawData.source).substring(2).padStart(42, '0');
  const fee = parseInt(rawData.fee).toString(16).padStart(10, '0');
  const counter = parseInt(rawData.counter).toString(16).padStart(10, '0'); 
  const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(10, '0');
  const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(10, '0');
   const balance = parseInt(rawData.balance).toString(16).padStart(10, '0');

   const argument = branch + source + fee + counter + gas_limit + storage_limit + balance;
   return argument;
};

export const getDelegationArgument = async (rawData: types.xtzDelegation)
 : Promise<string> => {
   const branch = stringUtil.handleHex(codec.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codec.addressHashToHex(rawData.source).substring(2).padStart(42, '0');
   const fee = parseInt(rawData.fee).toString(16).padStart(10, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(10, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(10, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(10, '0');
   const delegate = codec.addressHashToHex(rawData.delegate!).substring(2).padStart(42, '0');
   
   const argument = branch + source + fee + counter + gas_limit + storage_limit + delegate;
   return argument;
};

const getUnDelegationArgument = async (rawData: types.xtzDelegation)
 : Promise<string> => {
  const branch = stringUtil.handleHex(rawData.branch).padStart(64, '0');
  const source  = codec.addressHashToHex(rawData.source).substring(2).padStart(42, '0');
  const fee = parseInt(rawData.fee).toString(16).padStart(10, '0');
  const counter = parseInt(rawData.counter).toString(16).padStart(10, '0'); 
  const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(10, '0');
  const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(10, '0');

   const argument = branch + source + fee + counter + gas_limit + storage_limit;
   return argument;
};