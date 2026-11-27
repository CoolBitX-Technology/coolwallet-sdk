import type { CommandType } from '../execute/command';

interface AppletStatus {
  status: boolean;
  statusCode: string;
}

interface SEUpdateInfo {
  isNeedUpdate: boolean;
  curVersion: number;
  newVersion: number;
}

interface APIOptions {
  body: string;
  method: string;
  headers: {
    Accept: string;
    'Content-Type': string;
  };
}

type Command = {
  packets: string;
} & CommandType;

interface KeyInfo {
  // GET DATA (80CA00E0) responses of the two security domains, data ‖ SW in hex
  ssdKeyInfo: string;
  isdKeyInfo: string;
  // The domain still has the keys the card was issued with (SSD KVN 0x0A, ISD KVN 0x01)
  isNeedRotateSsdKey: boolean;
  isNeedRotateIsdKey: boolean;
}

export type { AppletStatus, SEUpdateInfo, Command, APIOptions, KeyInfo };
