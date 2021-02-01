import { error, utils } from '@coolwallet/core';
import { TransactionType, Transfer, PlaceOrder, CancelOrder, typePrefix } from '../config/types'
import { COIN_TYPE } from '../config/param'



const getPath = async (addressIndex: number) => {
  let path = await utils.getPath(COIN_TYPE, addressIndex)
  path = '15' + path
  return path
};


export const getTransferArgument = async (signObj: Transfer, addressIndex: number) => {
  const from = Buffer.from(signObj.msgs[0].inputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(signObj.msgs[0].outputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const value = signObj.msgs[0].outputs[0].coins[0].amount.toString(16).padStart(16, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  const memo = Buffer.from(signObj.memo, 'ascii').toString('hex');
  return await getPath(addressIndex) + from + to + value + accountNumber + sequence + source + memo;
};

export const getPlaceOrderArgument = async (signObj: PlaceOrder, addressIndex: number) => {
  const id = signObj.msgs[0].id;
  const sideNum = signObj.msgs[0].side;
  if (sideNum != 1 && sideNum != 2) { //1:BUY 2:SELL
    throw new error.SDKError(getPlaceOrderArgument.name, `Unsupport side '${sideNum}'`);
  }
  const symbol = signObj.msgs[0].symbol;
  const timeinforce = signObj.msgs[0].timeinforce;
  if (timeinforce != 1 && timeinforce != 3) { //1:GoodTillExpire 3:ImmediateOrCancel
    throw new error.SDKError(getPlaceOrderArgument.name, `Unsupport timeinforce '${timeinforce}'`);
  }

  const orderAddress = id.split("-")[0].padStart(40, '0');
  const orderSequence = parseInt(id.split("-")[1]).toString(16).padStart(16, '0');
  const senderAddress = Buffer.from(signObj.msgs[0].sender, 'ascii').toString('hex').padStart(128, '0');
  const side = sideNum.toString(16).padStart(2, '0');
  const quoteTokenName = Buffer.from(symbol.split("_")[0], 'ascii').toString('hex').padStart(40, '0');
  const baseTokenName = Buffer.from(symbol.split("_")[1], 'ascii').toString('hex').padStart(40, '0');
  const quantity = signObj.msgs[0].quantity.toString(16).padStart(16, '0');
  const price = signObj.msgs[0].price.toString(16).padStart(16, '0');
  const isImmediate = timeinforce == 1 ? "00" : "01";
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  return await getPath(addressIndex) + 
    orderAddress +
    orderSequence +
    senderAddress +
    side +
    quoteTokenName +
    baseTokenName +
    quantity +
    price +
    isImmediate +
    accountNumber +
    sequence +
    source;
};

export const getCancelOrderArgument = async (signObj: CancelOrder, addressIndex: number) => {
  const refid = signObj.msgs[0].refid;
  const symbol = signObj.msgs[0].symbol;

  const orderAddress = refid.split("-")[0].padStart(40, '0');
  const orderSequence = parseInt(refid.split("-")[1]).toString(16).padStart(16, '0');
  const senderAddress = Buffer.from(signObj.msgs[0].sender, 'ascii').toString('hex').padStart(128, '0');
  const quoteTokenName = Buffer.from(symbol.split("_")[0], 'ascii').toString('hex').padStart(40, '0');
  const baseTokenName = Buffer.from(symbol.split("_")[1], 'ascii').toString('hex').padStart(40, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  return await getPath(addressIndex) + 
    orderAddress +
    orderSequence +
    senderAddress +
    quoteTokenName +
    baseTokenName +
    accountNumber +
    sequence +
    source;
};

export const getTokenArgument = async (signObj: Transfer, denom: string, tokenSignature: string, addressIndex: number) => {
  const from = Buffer.from(signObj.msgs[0].inputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const to = Buffer.from(signObj.msgs[0].outputs[0].address, 'ascii').toString('hex').padStart(128, '0');
  const value = signObj.msgs[0].outputs[0].coins[0].amount.toString(16).padStart(16, '0');
  const accountNumber = parseInt(signObj.account_number).toString(16).padStart(16, '0');
  const sequence = parseInt(signObj.sequence).toString(16).padStart(16, '0');
  const source = parseInt(signObj.source).toString(16).padStart(16, '0');
  const tokenName = Buffer.from(denom.split("-")[0], 'ascii').toString('hex').padStart(40, '0');
  const tokenCheck = Buffer.from(denom.split("-")[1], 'ascii').toString('hex').padStart(40, '0');
  const signature = tokenSignature.slice(10).padStart(144, "0").toLowerCase();
  const memo = Buffer.from(signObj.memo, 'ascii').toString('hex');
  const argument = from + to + value + accountNumber + sequence + source + tokenName + tokenCheck + signature + memo
  
  console.log("tokenName: " + tokenName)
  console.log("tokenCheck: " + tokenCheck)
  console.log("signature: " + signature)
  console.log("arg: " + argument)
  return await getPath(addressIndex) + argument;
};
