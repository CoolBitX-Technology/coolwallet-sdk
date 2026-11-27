import { CardType, Transport } from '../../src';
import { executeAPDU } from '../../src/apdu/execute/execute';
import { getSEVersion } from '../../src/info';
import { target } from '../../src/config/param';

// Responds with the given raw responses in order, 9000 once the list runs out.
const mockTransport = (cardType: CardType, responses: string[] = []) => {
  let index = 0;
  return {
    cardType,
    request: jest.fn(async () => {
      const response = responses[index] ?? '9000';
      index += 1;
      return response;
    }),
  } as unknown as Transport;
};

// A different command each call, so executeAPDU's repeated-command counter never inserts an extra power-off APDU.
let apduIndex = 0;
const nextApdu = () => {
  apduIndex += 1;
  return { command: apduIndex.toString(16).padStart(10, '0'), data: '' };
};

describe('executeAPDU error message', () => {
  it('queries and caches the SE version on the first version-dependent status word', async () => {
    const transport = mockTransport(CardType.Pro, ['6903', '015B9000', '6A01']); // 347
    const first = await executeAPDU(transport, nextApdu(), target.SE);
    expect(first.msg).toBe('appid need registered');
    expect(transport.seVersion).toBe(347);
    expect(transport.request).toHaveBeenCalledTimes(2);

    const second = await executeAPDU(transport, nextApdu(), target.SE);
    expect(second.msg).toBe('script signature verification failed');
    expect(transport.request).toHaveBeenCalledTimes(3);
  });

  it('does not query the SE version for success or version-independent status words', async () => {
    const transport = mockTransport(CardType.Pro, ['9000', '6A86']);
    await executeAPDU(transport, nextApdu(), target.SE);
    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('incorrect p1 & p2');
    expect(transport.request).toHaveBeenCalledTimes(2);
    expect(transport.seVersion).toBeUndefined();
  });

  it('does not query again when the version query itself returns a version-dependent status word', async () => {
    const transport = mockTransport(CardType.Pro, ['6A01', '6903']);
    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('unsupported script command');
    expect(transport.request).toHaveBeenCalledTimes(2);
    expect(transport.seVersion).toBeUndefined();
  });

  it('uses legacy messages when the version query fails', async () => {
    const transport = mockTransport(CardType.Pro, ['6A01', '6D00']);
    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('unsupported script command');
    expect(transport.seVersion).toBeUndefined();
  });

  it.each([
    [CardType.Pro, '015B'], // 347
    [CardType.Go, '0065'], // 101
  ])('uses renumbered messages once getSEVersion caches a %s renumbered version', async (cardType, version) => {
    const transport = mockTransport(cardType, [`${version}9000`, '6903']);
    await getSEVersion(transport);
    expect(transport.seVersion).toBe(parseInt(version, 16));

    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('appid need registered');
  });

  it('keeps legacy messages for an old cached version', async () => {
    const transport = mockTransport(CardType.Pro, ['015A9000', '6A01']); // 346
    await getSEVersion(transport);

    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('unsupported script command');
  });

  it('does not cache the version from a non-9000 GET_SE_VERSION response', async () => {
    const transport = mockTransport(CardType.Pro, ['015B6985']);
    await expect(getSEVersion(transport)).resolves.toBe(347);
    expect(transport.seVersion).toBeUndefined();
  });

  it('does not cache a non-numeric SE version', async () => {
    const transport = mockTransport(CardType.Pro, ['ZZZZ9000', '6A01', 'ZZZZ9000']);
    await expect(getSEVersion(transport)).resolves.toBeNaN();
    expect(transport.seVersion).toBeUndefined();

    const { msg } = await executeAPDU(transport, nextApdu(), target.SE);
    expect(msg).toBe('unsupported script command');
    expect(transport.seVersion).toBeUndefined();
  });

  it('does not overwrite the cached version when getSEVersion fails', async () => {
    const transport = mockTransport(CardType.Pro, ['6D00']);
    transport.seVersion = 347;
    await expect(getSEVersion(transport)).resolves.toBe(0);
    expect(transport.seVersion).toBe(347);
  });

  it('keeps legacy messages for MCU responses', async () => {
    const transport = mockTransport(CardType.Pro, ['6A01']);
    transport.seVersion = 347;
    const { msg } = await executeAPDU(transport, nextApdu(), target.MCU);
    expect(msg).toBe('unsupported script command');
  });
});

describe('executeAPDU isolated', () => {
  const POWER_OFF = '00097F8000000000000000';
  const sentCommands = (transport: Transport) =>
    (transport.request as jest.Mock).mock.calls.map(([command]: [string]) => command);

  it('inserts a power off before the third repeated command when not isolated', async () => {
    const transport = mockTransport(CardType.Pro);
    const apdu = nextApdu();
    for (let i = 0; i < 3; i += 1) await executeAPDU(transport, apdu, target.SE);
    expect(sentCommands(transport)).toEqual([apdu.command, apdu.command, POWER_OFF, apdu.command]);
  });

  it('never inserts a power off', async () => {
    const transport = mockTransport(CardType.Pro);
    const apdu = nextApdu();
    for (let i = 0; i < 4; i += 1) await executeAPDU(transport, apdu, target.SE, { isolated: true });
    expect(sentCommands(transport)).toEqual(Array(4).fill(apdu.command));
  });

  it('does not count toward the power off of other commands', async () => {
    const transport = mockTransport(CardType.Pro);
    const apdu = nextApdu();
    await executeAPDU(transport, apdu, target.SE);
    await executeAPDU(transport, apdu, target.SE, { isolated: true });
    await executeAPDU(transport, apdu, target.SE);
    expect(sentCommands(transport)).not.toContain(POWER_OFF);
  });

  it('does not query the SE version on a version-dependent status word', async () => {
    const transport = mockTransport(CardType.Pro, ['6903']);
    const { statusCode, msg } = await executeAPDU(transport, nextApdu(), target.SE, { isolated: true });
    expect(statusCode).toBe('6903');
    expect(msg).toBe('unknown command error'); // legacy table, as no version is cached
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('does not log the data', async () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    try {
      const transport = mockTransport(CardType.Pro);
      const secret = 'c0ffee'.repeat(8);
      await executeAPDU(transport, { ...nextApdu(), data: secret }, target.SE, { isolated: true });
      const logged = debug.mock.calls.flat().join('\n');
      expect(logged).not.toContain(secret);
      expect(logged).toContain('(not logged, 24 bytes)');
    } finally {
      debug.mockRestore();
    }
  });

  it('uses the cached SE version for the message', async () => {
    const transport = mockTransport(CardType.Pro, ['6903']);
    transport.seVersion = 347;
    const { msg } = await executeAPDU(transport, nextApdu(), target.SE, { isolated: true });
    expect(msg).toBe('appid need registered');
    expect(transport.request).toHaveBeenCalledTimes(1);
  });
});
