import { transport } from "@coolwallets/core";

declare class RNBleTransport extends transport.default {
  static setLogLevel(logLevel: string): void;
}

export = RNBleTransport
