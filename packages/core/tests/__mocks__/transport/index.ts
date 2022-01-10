import { transport as Transport } from '../../../src';
import { Characteristic } from '../IPC';
import type { IPC } from '../IPC';

class MockedTransport extends Transport.default {
  private commandCharacteristic: Characteristic<'Command'>;
  private dataCharacteristic: Characteristic<'Data'>;
  private statusCharacteristic: Characteristic<'Status'>;
  private responseCharacteristic: Characteristic<'Response'>;

  constructor(ipc: IPC) {
    super({ name: 'MOCKED' } as BluetoothDevice);
    this.commandCharacteristic = new Characteristic(ipc, 'Command');
    this.dataCharacteristic = new Characteristic(ipc, 'Data');
    this.statusCharacteristic = new Characteristic(ipc, 'Status');
    this.responseCharacteristic = new Characteristic(ipc, 'Response');
  }

  async sendCommandToCard(command: number[]): Promise<void> {
    await this.commandCharacteristic.writeValue(new Uint8Array(command));
  }

  async sendDataToCard(packets: number[]): Promise<void> {
    await this.dataCharacteristic.writeValue(new Uint8Array(packets));
  }

  async checkCardStatus(): Promise<number> {
    const status = await this.statusCharacteristic?.readValue();
    return status[0];
  }

  async readDataFromCard(): Promise<number[]> {
    const status = await this.responseCharacteristic?.readValue();
    return Array.from(status);
  }
}

export default MockedTransport;
