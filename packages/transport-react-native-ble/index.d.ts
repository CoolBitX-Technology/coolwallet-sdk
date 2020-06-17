import Transport from "@coolwallet/core";

declare class RNBleTransport extends Transport {
  static setLogLevel(logLevel: string): void;
}

export = RNBleTransport
