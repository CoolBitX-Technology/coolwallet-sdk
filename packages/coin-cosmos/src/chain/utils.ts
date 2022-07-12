function utf8ToHex(str: string) {
  return Buffer.from(str).toString('hex');
}

function getHexBufferLength(hex: string) {
  return Math.ceil(hex.length / 2)
    .toString(16)
    .padStart(2, '0');
}

export { utf8ToHex, getHexBufferLength };
