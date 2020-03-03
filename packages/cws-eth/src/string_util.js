
const evenHexDigit = (hex) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const removeHex0x = (hex) => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);

export const handleHex = (hex) => evenHexDigit(removeHex0x(hex));
