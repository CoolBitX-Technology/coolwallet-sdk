import Transport from "@coolwallets/transport";

declare class RNBleTransport extends Transport {
  static setLogLevel(logLevel: string): void;
}

export = RNBleTransport