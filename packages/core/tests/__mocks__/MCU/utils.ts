function decodeCommand(command: string) {
  const cla = command.slice(4, 6);
  const ins = command.slice(6, 8);
  const p1 = command.slice(8, 10);
  const p2 = command.slice(10, 12);
  const originDataLength = parseInt(command.slice(12, 16), 16) * 2;
  const packetsCount = parseInt(command.slice(-1), 16);

  return { cla, ins, p1, p2, originDataLength, packetsCount };
}

function getCheckSum(data: string[]) {
  let XORTemp = 0;
  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-bitwise
    XORTemp ^= parseInt(data[i], 16);
  }
  let temp = XORTemp.toString(16);
  if (temp.length % 2 !== 0) {
    temp = `0${temp}`;
  }

  return temp;
}

function uint8ArrayToHex(array: Uint8Array): string {
  return Buffer.from(array).toString('hex');
}

export { decodeCommand, getCheckSum, uint8ArrayToHex };
