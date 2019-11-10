export function convertToHex(dataView) {
  let value = ''
  for (let i = 0; i < dataView.byteLength; i++) {
    const v = dataView.getUint8(i).toString(16)
    value += v.length < 2 ? '0' + v : v
  }
  return value
}
