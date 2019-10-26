
export const assemblyCommandAndData = (cla, ins, p1, p2, oriData) => {
  let pid = '00',
    cmd_len = '09'

  let packet_length = 18,
    data_length = 0
  // flag = true;
  let packets = ''

  if (!!oriData) {
    packets = oriData
    const data = packets.match(/.{2}/g)
    const checksum = getCheckSum(data)
    packets = packets + checksum
  }

  let dataBuf = Buffer.from(packets, 'hex')
  let copiedData = dataBuf
  let XOR_length = dataBuf.length
  let oriData_length = XOR_length

  if (packets.length > 0) {
    copiedData = Buffer.from(copiedData, 'hex')
    const length = copiedData.length / packet_length
    const remains = copiedData.length % packet_length
    data_length = data_length + length
    if (remains > 0) {
      data_length++
    }

    oriData_length = oriData_length - 1
  }

  const oriDataBuf = Buffer.allocUnsafe(4)
  oriDataBuf.fill(0)
  oriDataBuf.writeInt16BE(oriData_length, 0)
  oriData_length = oriDataBuf.slice(0, 2).toString('hex')
  oriData_length = oriData_length.toString('hex').padStart(4, '0')

  const XORData = Buffer.allocUnsafe(4)
  XORData.fill(0)
  XORData.writeInt16BE(XOR_length, 0)
  XOR_length = XORData.slice(0, 2).toString('hex')
  XOR_length = XOR_length.toString('hex').padStart(4, '0')
  data_length = Buffer.from([data_length])

  const command = pid + cmd_len + cla + ins + p1 + p2 + oriData_length + XOR_length + data_length.toString('hex')
  return { command, data: packets }
}

const getCheckSum = data => {
  let XOR_temp = 0
  for (let i = 0; i < data.length; i++) {
    XOR_temp ^= parseInt(data[i], 16)
  }
  let temp = XOR_temp.toString(16)
  if (temp.length % 2 !== 0) {
    temp = `0${temp}`
  }

  return temp
}
