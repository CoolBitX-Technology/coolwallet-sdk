export function convertToNumberArray(hex) {
  if (!hex) {
    return [];
  }
  let byteArray = [];
  let length = hex.length;
  for (let i = 0; i < length; i += 2) {
    byteArray.push(parseInt(hex.substr(i, 2), 16))
  }
  return byteArray;
}