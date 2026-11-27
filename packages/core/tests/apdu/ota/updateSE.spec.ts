import { CardType, Transport } from '../../../src';
import { updateSE, updateSEPart1 } from '../../../src/apdu/ota/ota';
import { rotateKey } from '../../../src/apdu/ota/keyRotation';

jest.mock('../../../src/apdu/ota/keyRotation', () => ({
  ...jest.requireActual('../../../src/apdu/ota/keyRotation'),
  rotateKey: jest.fn(),
}));

const mockedRotateKey = rotateKey as jest.MockedFunction<typeof rotateKey>;
const SSD_AID = 'A000000151535041';

const mockTransport = (cardType: CardType, respond: () => Promise<string>) =>
  ({ cardType, request: jest.fn(respond) } as unknown as Transport);

// Whether the SSD was selected, the first step of the firmware update after the backup.
const selectedSsd = (transport: Transport) =>
  (transport.request as jest.Mock).mock.calls.some(
    ([command, data]: [string, string]) =>
      command.slice(4, 8).toUpperCase() === '00A4' && data.slice(0, -2).toUpperCase() === SSD_AID
  );

const params = (transport: Transport, progressCallback = jest.fn()) => ({
  transport,
  cardId: 'CWP600000',
  appId: 'ab'.repeat(20),
  appPrivateKey: '11'.repeat(32),
  progressCallback,
  callAPI: jest.fn(),
  apiSecret: 'secret',
});

beforeEach(() => mockedRotateKey.mockReset());

describe.each([
  ['updateSE', updateSE],
  ['updateSEPart1', updateSEPart1],
])('%s key rotation', (_, update) => {
  it('rotates the keys of a Pro card first and stops the update when it fails', async () => {
    mockedRotateKey.mockImplementation(async ({ progressCallback }) => {
      progressCallback?.(2, 4);
      throw new Error('key rotation API failed, code: 40916');
    });
    const transport = mockTransport(CardType.Pro, async () => '9000');
    const progressCallback = jest.fn();

    await expect(update(params(transport, progressCallback))).rejects.toThrow('code: 40916');
    expect(mockedRotateKey).toHaveBeenCalledWith(
      expect.objectContaining({ transport, cardId: 'CWP600000', apiSecret: 'secret' })
    );
    // half of the flow, scaled to the first progress step (14)
    expect(progressCallback.mock.calls).toEqual([[7]]);
    expect(selectedSsd(transport)).toBe(false);
  });

  it('scales the rotation progress to the first step when the MCU is updated too', async () => {
    mockedRotateKey.mockImplementation(async ({ progressCallback }) => {
      progressCallback?.(4, 4);
      throw new Error('stop');
    });
    const transport = mockTransport(CardType.Pro, async () => '9000');
    const progressCallback = jest.fn();
    await expect(update({ ...params(transport, progressCallback), updateMCU: true })).rejects.toThrow('stop');
    expect(progressCallback.mock.calls).toEqual([[7]]); // the first step is 7 when the MCU is updated
  });

  it('does not rotate the keys of a Go card', async () => {
    const transport = mockTransport(CardType.Go, async () => {
      throw new Error('card unavailable');
    });
    await expect(update(params(transport))).rejects.toThrow('SE Update Failed');
    expect(mockedRotateKey).not.toHaveBeenCalled();
  });
});
