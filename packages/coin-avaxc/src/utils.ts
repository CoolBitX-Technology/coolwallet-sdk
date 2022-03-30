
import { ChainId } from './params';

export interface Transaction {
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
}

const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
export const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
export const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));
export const hexToBuffer = (hex: string) => {
  hex = handleHex(hex);
  if (hex === '00' || hex === '') {
    return Buffer.allocUnsafe(0);
  }
  return Buffer.from(hex, 'hex');
};

export const asciiToHex = (str: string) => {
  if(!str)
      return "0x00";
  let hex = "";

  for(let v of str){
    let n = v.charCodeAt(0).toString(16);
    hex += n.length < 2 ? '0' + n : n;
  }

  return "0x" + hex;
};

export const getRawTx = (transaction: Transaction): Array<Buffer> => {
  const rawData = [];
  rawData.push(hexToBuffer(transaction.nonce));
  rawData.push(hexToBuffer(transaction.gasPrice));
  rawData.push(hexToBuffer(transaction.gasLimit));
  rawData.push(hexToBuffer(transaction.to));
  rawData.push(hexToBuffer(transaction.value));
  rawData.push(hexToBuffer(transaction.data));
  rawData.push(hexToBuffer(ChainId.toString(16)));
  rawData.push(Buffer.allocUnsafe(0));
  rawData.push(Buffer.allocUnsafe(0));

  return rawData;
};
