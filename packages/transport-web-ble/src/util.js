export function hexStringToByte(str) {
  if (!str) {
    return new Uint8Array()
  }
  var a = []
  for (var i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16))
  }
  return new Uint8Array(a)
}

export function convertToHex(dataView) {
  let value = ''
  for (let i = 0; i < dataView.byteLength; i++) {
    const v = dataView.getUint8(i).toString(16)
    value += v.length < 2 ? '0' + v : v
  }
  return value
}
