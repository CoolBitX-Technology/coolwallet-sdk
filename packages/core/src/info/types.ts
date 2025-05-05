interface MCUVersion {
  fwStatus: string;
  cardMCUVersion: string;
}

interface MCUInfo {
  hardwareVersion: string;
  firmwareVersion: string;
  battery: string;
}

export { MCUInfo, MCUVersion };
