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

export type { AppletStatus, SEUpdateInfo, Command, APIOptions };
