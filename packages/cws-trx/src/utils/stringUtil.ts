
export {
  removeHex0x, handleHex
};


const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

const removeHex0x = (hex: string) => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);

const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));
