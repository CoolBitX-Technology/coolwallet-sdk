import { Transport } from '@coolwallet/core';

export interface CoreInputs {
  transport: Transport,
  appPublicKey: string,
  appPrivateKey: string,
  appId: string,
  setAppId: (appId: string) => void,
  isLocked: boolean,
  setIsLocked: (isLocked: boolean) => void,
}
