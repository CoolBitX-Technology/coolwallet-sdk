import * as types from '../config/types';
import { hexString } from '../config/types';
import { utils, config } from '@coolwallet/core';
import * as params from '../config/params';
import * as stringUtil from './stringUtil';
import * as codecUtil from '../utils/codecUtil';
import * as cryptoUtil from '../utils/cryptoUtil';

/**
* Add Tezos (XTZ) key path to argument where
* the default XTZ derivation path is m'/1729'/<account>'/change'
*/
const addPathByType = async (
   pathType: types.PATH_STYLE, 
   argument: hexString, 
   addressIndex: number
): Promise<hexString> => {
   switch(pathType) {
      case types.PATH_STYLE.XTZ:
        const XTZPath: hexString = `11${cryptoUtil.getXtzPath(config.PathType.SLIP0010.toString(), addressIndex)}`;
        return XTZPath + argument;
      case types.PATH_STYLE.CWT:
      default:
        const CWSPath: hexString = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
        return CWSPath + argument;
      }   
};

export const getTransferTransactionArgument = async (
   pathType: types.PATH_STYLE,
   rawData: types.xtzTransaction,
   addressIndex: number
): Promise<hexString> => {
   const branch = stringUtil.handleHex(codecUtil.branchHashToHex(rawData.branch));
   const source  = codecUtil.addressStrToHex(rawData.source);
   const sourceAddressType  = source.substring(2, 4);
   const sourceAddress  = source.substring(4);
   const fee = parseInt(rawData.fee).toString(16).padStart(20, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(20, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(20, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(20, '0');
   const amount = parseInt(rawData.amount).toString(16).padStart(20, '0');
   const destination = codecUtil.addressStrToHex(rawData.destination);
   const destinationAccountType = destination.substring(0, 2);
   let destinationAddressType: hexString;
   let destinationAddress: hexString;
   if(destinationAccountType == '00') { // implicit account
      destinationAddressType = destination.substring(2, 4);
      destinationAddress = destination.substring(4);
   } else { // originated account
      destinationAddressType = destination.substring(42);
      destinationAddress = destination.substring(2, 42);
   }

   const argument: hexString = branch + sourceAddressType + sourceAddress + fee + counter + gas_limit + storage_limit + amount + destinationAccountType + destinationAddressType + destinationAddress;
   return addPathByType(pathType, argument, addressIndex);
};

export const getRevealArgument = async (
   pathType: types.PATH_STYLE,
   rawData: types.xtzReveal,
   addressIndex: number
): Promise<hexString> => {
   const branch = stringUtil.handleHex(codecUtil.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codecUtil.addressStrToHex(rawData.source);
   const sourceAddressType = source.substring(2, 4);
   const sourceAddress = source.substring(4);
   const fee = parseInt(rawData.fee).toString(16).padStart(20, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(20, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(20, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(20, '0');
   const public_key = codecUtil.pubKeyStrToHex(rawData.public_key).padStart(66,'0');
   
   const argument: hexString = branch + sourceAddressType + sourceAddress + fee + counter + gas_limit + storage_limit + public_key;
   return addPathByType(pathType, argument, addressIndex);
};

// TBD
export const getOriginationArgument = async (
   pathType: types.PATH_STYLE,
   rawData: types.xtzOrigination,
   addressIndex: number
): Promise<hexString> => {
   const branch = stringUtil.handleHex(codecUtil.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codecUtil.addressStrToHex(rawData.source);
   const sourceAddressType = source.substring(2, 4);
   const sourceAddress = source.substring(4);
   const fee = parseInt(rawData.fee).toString(16).padStart(20, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(20, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(20, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(20, '0');
   const balance = parseInt(rawData.balance).toString(16).padStart(20, '0');

   const argument: hexString = branch + sourceAddressType + sourceAddress + fee + counter + gas_limit + storage_limit + balance;
   return addPathByType(pathType, argument, addressIndex);
};

export const getDelegationArgument = async (
   pathType: types.PATH_STYLE,
   rawData: types.xtzDelegation,
   addressIndex: number
): Promise<hexString> => {
   const branch = stringUtil.handleHex(codecUtil.branchHashToHex(rawData.branch)).padStart(64, '0');
   const source  = codecUtil.addressStrToHex(rawData.source);
   const sourceAddressType = source.substring(2, 4);
   const sourceAddress = source.substring(4);
   const fee = parseInt(rawData.fee).toString(16).padStart(20, '0');
   const counter = parseInt(rawData.counter).toString(16).padStart(20, '0'); 
   const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(20, '0');
   const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(20, '0');
   const delegate = codecUtil.addressStrToHex(rawData.delegate!);
   const delegateAddressType = delegate.substring(2, 4);
   const delegateAddress = delegate.substring(4);
   
   const argument: hexString = branch + sourceAddressType + sourceAddress + fee + counter + gas_limit + storage_limit + delegateAddressType + delegateAddress;
   return addPathByType(pathType, argument, addressIndex);
};

export const getUndelegationArgument = async (
   pathType: types.PATH_STYLE,
   rawData: types.xtzDelegation,
   addressIndex: number
): Promise<hexString> => {
   const branch = stringUtil.handleHex(codecUtil.branchHashToHex(rawData.branch)).padStart(64, '0');
  const source  = codecUtil.addressStrToHex(rawData.source);
  const sourceAddressType = source.substring(2, 4);
  const sourceAddress = source.substring(4);
  const fee = parseInt(rawData.fee).toString(16).padStart(20, '0');
  const counter = parseInt(rawData.counter).toString(16).padStart(20, '0'); 
  const gas_limit = parseInt(rawData.gas_limit).toString(16).padStart(20, '0');
  const storage_limit = parseInt(rawData.storage_limit).toString(16).padStart(20, '0');

   const argument: hexString = branch + sourceAddressType + sourceAddress + fee + counter + gas_limit + storage_limit;
   return addPathByType(pathType, argument, addressIndex);
};