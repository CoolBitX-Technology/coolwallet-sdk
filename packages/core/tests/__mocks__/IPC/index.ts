import { Emitter } from 'mitt';

type CharacteristicKind = 'Command' | 'Data' | 'Status' | 'Response';

type SendEvents<T extends CharacteristicKind> = {
  [K in `send${T}`]: Uint8Array;
};

type ReceiveEvents<T extends CharacteristicKind> = {
  [K in `receive${T}`]: void;
};

type IPC = Emitter<SendEvents<CharacteristicKind> & ReceiveEvents<CharacteristicKind>>;

export type { CharacteristicKind, SendEvents, ReceiveEvents, IPC };
export { default as Characteristic } from './Characteristic';
