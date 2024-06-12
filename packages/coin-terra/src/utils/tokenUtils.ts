import { handleHex } from './stringUtils';

export function getSetTokenPayload(contractAddress: string, symbol: string, decimals: number): string {
  const unit = handleHex(decimals.toString(16));
  if (symbol.length > 7) {
    symbol = symbol.substring(0, 7);
  }
  const len = handleHex(symbol.length.toString(16));
  const symbolHex = handleHex(Buffer.from(symbol, 'ascii').toString('hex')).padEnd(14, '0');
  const setTokenPayload = unit + len + symbolHex + Buffer.from(contractAddress, 'ascii').toString('hex');
  return setTokenPayload;
}
