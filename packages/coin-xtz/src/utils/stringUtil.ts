import { hexString } from "../config/types";

const evenHexDigit = (hex: hexString) => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const removeHex0x = (hex: hexString) => (hex.slice(0, 2) === '0x' ? hex.slice(2) : hex);

export const handleHex = (hex: hexString) => evenHexDigit(removeHex0x(hex));