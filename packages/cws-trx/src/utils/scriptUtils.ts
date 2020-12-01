import { coinType, Transaction } from '../config/type'
import { handleHex } from "./stringUtil";

export {
  getArgument, getTransferArgument
};

const getArgument = async (addressIndex: number, getArg: CallableFunction) => {
  const addressIdxHex = "00".concat(addressIndex.toString(16).padStart(6, "0"));
  const SEPath = `15328000002C800000${coinType}8000000000000000${addressIdxHex}`;
  const argument = await getArg();
  return SEPath + argument
};

/**
 * [toAddress(20B)] [amount(10B)] [gasPrice(10B)] [gasLimit(10B)] [nonce(8B)] [chainId(2B)]
 * @param transaction 
 */
const getTransferArgument = (transaction: Transaction) => {
  const argument =
    handleHex(transaction.to) + // 81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C
    handleHex(transaction.value).padStart(20, "0") + // 000000b1a2bc2ec50000
    handleHex(transaction.gasPrice).padStart(20, "0") + // 0000000000020c855800
    handleHex(transaction.gasLimit).padStart(20, "0") + // 0000000000000000520c
    handleHex(transaction.nonce).padStart(16, "0") + // 0000000000000289
    handleHex(transaction.chainId.toString(16)).padStart(4, "0"); // 0001
  return argument;
};
