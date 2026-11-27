import { CardType, Transport } from '../../../src';
import { insertDeleteScript, insertLoadScript, insertScript } from '../../../src/apdu/ota/scripts';

const INSTALL_SCRIPT = '80E60C00' + 'aa'.repeat(8);
const LOAD_SCRIPT = ['80E60200' + 'bb'.repeat(8), '80E80000' + 'cc'.repeat(8), '80E88001' + 'dd'.repeat(8)].join('\n');

// Responds with the given status for each line in order, 9000 once the list runs out.
const mockTransport = (statusCodes: string[] = []) => {
  let index = 0;
  const transport = {
    cardType: CardType.Go,
    request: jest.fn(async () => {
      const statusCode = statusCodes[index] ?? '9000';
      index += 1;
      return statusCode;
    }),
  } as unknown as Transport;
  return transport;
};

describe('insertScript', () => {
  it('resolves when every line returns 9000', async () => {
    const transport = mockTransport();
    await expect(insertScript(transport, INSTALL_SCRIPT)).resolves.toBeUndefined();
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('throws when INSTALL returns non-9000', async () => {
    const transport = mockTransport(['6985']);
    await expect(insertScript(transport, INSTALL_SCRIPT)).rejects.toThrow(
      'INS E6 failed at line 0, status code: 6985'
    );
  });
});

describe('insertLoadScript', () => {
  it('resolves and reports progress when every line returns 9000', async () => {
    const transport = mockTransport();
    const progressCallback = jest.fn();
    await expect(insertLoadScript(transport, LOAD_SCRIPT, progressCallback, 50, 88)).resolves.toBeUndefined();
    expect(transport.request).toHaveBeenCalledTimes(3);
    expect(progressCallback).toHaveBeenCalledTimes(3);
  });

  it('stops at the first LOAD block that returns non-9000', async () => {
    const transport = mockTransport(['9000', '6A84']);
    const progressCallback = jest.fn();
    await expect(insertLoadScript(transport, LOAD_SCRIPT, progressCallback, 50, 88)).rejects.toThrow(
      'INS E8 failed at line 1, status code: 6A84'
    );
    expect(transport.request).toHaveBeenCalledTimes(2);
    expect(progressCallback).toHaveBeenCalledTimes(1);
  });
});

describe('6982 on LOAD / INSTALL', () => {
  it('is explained as a token key mismatch', async () => {
    const transport = mockTransport(['6982']);
    await expect(insertLoadScript(transport, LOAD_SCRIPT, jest.fn(), 50, 88)).rejects.toThrow(
      'INS E6 failed at line 0, status code: 6982 (script signature rejected'
    );
  });
});

describe('insertDeleteScript', () => {
  it.each(['9000', '6A88'])('still accepts %s (applet already deleted)', async (statusCode) => {
    const transport = mockTransport([statusCode]);
    await expect(insertDeleteScript(transport, '80E40000' + 'ee'.repeat(8))).resolves.toBeUndefined();
  });

  it('explains 6982 as a token key mismatch and stops at the first line', async () => {
    const transport = mockTransport(['6982']);
    // A command not sent before, so executeAPDU's repeated-command counter inserts no power off
    const script = ['80E40000' + 'ee'.repeat(9), '80E40080' + 'ee'.repeat(9)].join('\n');
    await expect(insertDeleteScript(transport, script)).rejects.toThrow(
      'Delete failed, status code: 6982 (script signature rejected or SSD not authenticated'
    );
    expect(transport.request).toHaveBeenCalledTimes(1);
  });

  it('keeps other status codes as they are', async () => {
    const transport = mockTransport(['6985']);
    const error = await insertDeleteScript(transport, '80E40000' + 'ee'.repeat(10)).catch((e) => e);
    expect(error.message).toContain('Delete failed, status code: 6985');
    expect(error.message).not.toContain('signature');
  });
});
