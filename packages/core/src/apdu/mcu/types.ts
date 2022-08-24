interface MCUInfo {
  fwStatus: string;
  cardMCUVersion: string;
}

interface MCUVersion {
  firmwareVersion: string;
  MCUVersion: string;
}

interface UpdateInfo {
  isNeedUpdate: boolean;
  curVersion: string;
  newVersion: string;
}

interface DFUCommand {
  apduCmd: { p1: string; p2: string; packets: string }[];
  packetNums: number;
}

export { MCUInfo, MCUVersion, UpdateInfo, DFUCommand };
