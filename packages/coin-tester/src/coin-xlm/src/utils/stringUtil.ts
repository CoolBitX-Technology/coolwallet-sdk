
export const handleHex = (hex: string) => {
  const prefixRemoved = hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;
  return prefixRemoved.length % 2 !== 0 ? `0${prefixRemoved}` : prefixRemoved;
};
