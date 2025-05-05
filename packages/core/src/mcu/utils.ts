import type { DFUCommand } from './types';

const numberToHex = (n: number): string => {
  const p2 = n.toString(16);
  if (p2.length % 2 > 0) {
    return `0${p2}`;
  }

  return p2;
};

const assemblyDFUcommand = (data: string): DFUCommand => {
  // hex length is double longer than bytes's
  const packetLen = 2048 * 2;
  const result = [];

  const packetNums = Math.ceil(data.length / packetLen);

  let srcPos = 0;
  let dstPos = 0;

  console.debug(`data length=${data.length}/ packetNums=${packetNums}`);
  const p2 = numberToHex(packetNums);

  for (let i = 0; i < packetNums; i++) {
    srcPos = packetLen * i;
    dstPos = packetLen * (i + 1) >= data.length ? srcPos + data.length - packetLen * i : packetLen * (i + 1);

    const cmd = data.slice(srcPos, dstPos);

    const p1 = numberToHex(i + 1);

    const obj = {
      p1,
      p2,
      // packet
      packets: cmd,
    };

    console.debug(`${i} / ${packetNums}`);

    // put all ota data to native for executing loop ble command
    result.push(obj);
  }
  return { apduCmd: result, packetNums };
};

export { assemblyDFUcommand };
