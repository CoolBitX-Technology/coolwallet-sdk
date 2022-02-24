type APDUCommand = {
  cla: number;
  ins: number;
  p1: number;
  p2: number;
};

function decodeCommand(command: string): APDUCommand {
  const cla = command.slice(4, 6);
  const ins = command.slice(6, 8);
  const p1 = command.slice(8, 10);
  const p2 = command.slice(10, 12);
  const bytes = Int8Array.from(Buffer.from(cla + ins + p1 + p2, 'hex'));

  return { cla: bytes[0], ins: bytes[1], p1: bytes[2], p2: bytes[3] };
}

export { decodeCommand };
