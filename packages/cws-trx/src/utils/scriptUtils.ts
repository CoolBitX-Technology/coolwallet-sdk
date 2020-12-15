import { handleHex } from "./stringUtil";

type Transaction = {
  // [key: string]: any,
  chainId: number,
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
}

export {
  getTransferArgument
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
