import { CharacteristicKind, IPC } from '.';

class Characteristic<T extends CharacteristicKind> {
  private ipc: IPC;
  private characteristic: T;

  constructor(ipc: IPC, characteristic: T) {
    this.ipc = ipc;
    this.characteristic = characteristic;
  }

  async writeValue(value: Uint8Array) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(reject, 2000);
      this.ipc.on(`receive${this.characteristic}`, (args) => {
        clearTimeout(timeoutId);
        this.ipc.off(`receive${this.characteristic}`)
        resolve(args);
      });
      this.ipc.emit(`send${this.characteristic}`, value);
    });
  }

  async readValue(): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const timeoutId = setTimeout(reject, 2000);
      this.ipc.on(`send${this.characteristic}`, (args) => {
        clearTimeout(timeoutId);
        this.ipc.off(`send${this.characteristic}`)
        resolve(args);
      });
      this.ipc.emit(`receive${this.characteristic}`, null as unknown as void);
    });
  }
}

export default Characteristic;
