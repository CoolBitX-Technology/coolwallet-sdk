export interface Transaction {
  chainId: number;
  nonce: string;
  gasPrice: string;
  gasLimit: string;
  to: string;
  value: string;
  data: string;
}

const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
export const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));

export const getRawTx = (transaction: Transaction): Array<Buffer> => {
  let rawData = [];
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasPrice);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to);
  rawData.push(transaction.value);
  rawData.push(transaction.data);

  rawData = rawData.map((d) => {
    const hex = handleHex(d);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });
  rawData[6] = Buffer.from([transaction.chainId]);
  rawData[7] = Buffer.allocUnsafe(0);
  rawData[8] = Buffer.allocUnsafe(0);

  return rawData;
};
