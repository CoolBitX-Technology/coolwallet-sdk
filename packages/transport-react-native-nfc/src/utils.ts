type APDUCommand = {
  cla: number;
  ins: number;
  p1: number;
  p2: number;
};

function numberArrayToHexString(numberArray: number[]) {
  return numberArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexStringToNumberArray(hexString: string) {
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }

  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const numberArray = [];
  for (let i = 0; i < hexString.length; i += 2) {
    const byte = parseInt(hexString.substr(i, 2), 16);
    numberArray.push(byte);
  }
  return numberArray;
}

function decodeCommand(command: string): APDUCommand {
  const cla = command.slice(4, 6);
  const ins = command.slice(6, 8);
  const p1 = command.slice(8, 10);
  const p2 = command.slice(10, 12);
  const bytes = Int8Array.from(Buffer.from(cla + ins + p1 + p2, 'hex'));

  return { cla: bytes[0], ins: bytes[1], p1: bytes[2], p2: bytes[3] };
}

function encodeApdu(cla: number, ins: number, p1: number, p2: number, data: string): number[] {
  const dataBytes = hexStringToNumberArray(data);
  const dataLengthBytes =  hexStringToNumberArray(dataBytes.length.toString(16).padStart(6, '0'));

  return [cla, ins, p1, p2, ...dataLengthBytes, ...dataBytes];
}

export { decodeCommand, encodeApdu, numberArrayToHexString, hexStringToNumberArray };
