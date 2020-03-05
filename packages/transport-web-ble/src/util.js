export function convertToNumberArray(dataView) {
  const array = [];
  for (let i = 0; i < dataView.byteLength; i++) {
    const value = dataView.getUint8(i);
    array.push(value);
  }
  return array;
}
