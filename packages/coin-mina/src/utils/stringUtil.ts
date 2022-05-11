/* eslint-disable no-plusplus */
const pad = (n: number | string, width = 3, paddingValue: number | string = 0) => {
  return (String(paddingValue).repeat(width) + String(n)).slice(String(n).length);
};

const asciiToHex = (str: string) => {
  return Buffer.from(str, 'ascii').toString('hex');
};

const convertMemo = (memo: string) => {
  const length = 32;
  let charToAdd = length - memo.length;
  let stringToReturn = memo;
  while (charToAdd > 0) {
    stringToReturn += '\x00';
    charToAdd--;
  }
  return Buffer.from(stringToReturn, 'utf8').toString('hex');
};

export { pad, asciiToHex, convertMemo };
