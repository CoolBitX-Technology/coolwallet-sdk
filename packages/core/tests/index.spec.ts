import { MCU, MockedTransport } from './__mocks__';
import mitt from 'mitt';
import { apdu } from '../src';
import type { IPC } from './__mocks__/IPC';

const ipc: IPC = mitt();
const mcu = new MCU(ipc);
const transport = new MockedTransport(ipc);

beforeAll(() => {
  mcu.process();
});

describe('Test apdu general', () => {
  it('getNonce', async () => {
    const nonce = await apdu.general.getNonce(transport);
    expect(nonce).toHaveLength(16);
  });

  it('getSEVersion', async () => {
    const version = await apdu.general.getSEVersion(transport);
    expect(version).toEqual(9999);
  });

  it('echo', async () => {
    const message = Buffer.from(
      'Hello,World'
    ).toString('hex');
    const echo = await apdu.general.echo(transport, message);
    expect(echo).toBe(message);
  });

  it('echo with long length', async () => {
    const message = Buffer.from(
      'Hello,World12345412i320-1i2190ri0-iw0if-qwfowqjrio2jio4j12iorjioqwjfioawgiowioqjeioqwjeioqwjioejoij'
    ).toString('hex');
    const echo = await apdu.general.echo(transport, message);
    expect(echo).toBe(message);
  });
});

afterAll(() => {
  mcu.close();
});
