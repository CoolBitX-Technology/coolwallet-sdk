import { CardType, Transport } from '../../../src';
import { rotateKey } from '../../../src/apdu/ota/keyRotation';
import { KeyRotationAPIError } from '../../../src/apdu/ota/keyRotationApi';
import type { APIOptions } from '../../../src/apdu/ota/types';

// Resends wait for retryAfter; skip the wait.
jest.mock('../../../src/utils', () => ({
  ...jest.requireActual('../../../src/utils'),
  delay: jest.fn(async () => undefined),
}));

const SSD_AID = 'A000000151535041';
const SELECT_SSD = `00A4040008${SSD_AID}`;
const SELECT_ISD = '00A4040008A000000151000000';
const keyInfoOf = (kvn: string) => 'E012' + ['01', '02', '03'].map((keyId) => `C004${keyId}${kvn}8810`).join('');

const INIT_UPDATE = '8050000008' + '11'.repeat(8) + '00';
const EXT_AUTH = '8482110010' + '22'.repeat(16) + '00';
const PUT_SSD_KEY = '84D80A814B' + '33'.repeat(0x4b) + '00';
const PUT_TOKEN_KEY = '84D8700191' + '44'.repeat(0x91) + '00';
const PUT_ISD_KEY = '84D801814B' + '55'.repeat(0x4b) + '00';

// The plan of a Pro card that was never rotated (docs section 3.2)
const PRO_PLAN = [
  { domain: 'ssd', select: SELECT_SSD, apdus: [INIT_UPDATE, EXT_AUTH, PUT_SSD_KEY] },
  { domain: 'isd', select: SELECT_ISD, apdus: [INIT_UPDATE, EXT_AUTH, PUT_TOKEN_KEY, PUT_ISD_KEY] },
  { domain: 'isd', select: SELECT_ISD, apdus: [INIT_UPDATE, EXT_AUTH] },
  { domain: 'ssd', select: SELECT_SSD, apdus: [INIT_UPDATE, EXT_AUTH] },
];

const decodePayload = (options: APIOptions) => {
  const token = JSON.parse(options.body).payload as string;
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
};

const jsonResponse = (status: number, body: unknown) =>
  ({ status, text: async () => JSON.stringify(body) } as unknown as Response);

// 'drop': the API handles the request but its answer is lost on the way back
type Fault = { status: number; body: unknown } | Error | 'drop';

/**
 * A key rotation API that runs the plan. `faults` maps an endpoint (flows, sessions, responses, cancel)
 * to the errors its next calls answer, before it answers normally.
 */
const fakeApi = (plan = PRO_PLAN, faults: Record<string, Fault[]> = {}) => {
  const calls: { endpoint: string; payload: Record<string, unknown> }[] = [];
  const submitted: { step: number; response: string }[] = [];
  let sessionIndex = -1;
  let stepIndex = 0;
  let open = false;

  const command = () => ({
    flowId: 'f1',
    sessionId: `s${sessionIndex}`,
    domain: plan[sessionIndex].domain,
    status: 'continue',
    ...(stepIndex === 0 ? { select: plan[sessionIndex].select } : {}),
    step: stepIndex,
    apdu: plan[sessionIndex].apdus[stepIndex],
    flowState: 'ACTIVE',
  });

  const handle = (endpoint: string, payload: Record<string, unknown>) => {
    switch (endpoint) {
      case 'flows':
        return jsonResponse(200, {
          flowId: 'f1',
          expiresAt: '',
          sessions: plan.map(({ domain }) => ({ domain, steps: [] })),
          next: { domain: plan[0].domain },
        });
      case 'sessions':
        if (!open) {
          sessionIndex += 1;
          stepIndex = 0;
          open = true;
        }
        return jsonResponse(200, command());
      case 'responses': {
        const { step, response } = payload as { step: number; response: string };
        // A resend of the step already answered gives the same result
        if (step !== stepIndex - 1) {
          expect(step).toBe(stepIndex);
          submitted.push({ step, response });
          stepIndex += 1;
        }
        if (stepIndex < plan[sessionIndex].apdus.length) return jsonResponse(200, command());
        open = false;
        const last = sessionIndex === plan.length - 1;
        return jsonResponse(200, {
          flowId: 'f1',
          sessionId: `s${sessionIndex}`,
          domain: plan[sessionIndex].domain,
          status: 'done',
          flowState: last ? 'DONE' : 'ACTIVE',
          ...(last ? {} : { next: { domain: plan[sessionIndex + 1].domain } }),
        });
      }
      case 'cancel':
        return jsonResponse(200, { flowId: 'f1', cancelled: true });
      default:
        throw new Error(`unexpected endpoint ${endpoint}`);
    }
  };

  const callAPI = jest.fn(async (url: string, options: APIOptions) => {
    const endpoint = url.split('/').pop() as string;
    const payload = decodePayload(options);
    calls.push({ endpoint, payload });
    const fault = faults[endpoint]?.shift();
    if (fault instanceof Error) throw fault;
    if (fault && fault !== 'drop') return jsonResponse(fault.status, fault.body);
    const answer = handle(endpoint, payload);
    if (fault === 'drop') throw new Error('answer lost');
    return answer;
  });

  const endpoints = () => calls.map(({ endpoint }) => endpoint);
  return { callAPI, calls, submitted, endpoints };
};

type Sent = { header: string; data: string };

/**
 * A card that answers GET DATA with the key information of the selected domain, a 4-byte response to
 * the key rotation commands, and 9000 to anything else. `answers` overrides the response by header.
 */
const fakeCard = ({
  cardType = CardType.Pro,
  ssdKvn = '0A',
  isdKvn = '01',
  answers = {},
}: { cardType?: CardType; ssdKvn?: string; isdKvn?: string; answers?: Record<string, string | Error> } = {}) => {
  const sent: Sent[] = [];
  let selected = '';
  const transport = {
    cardType,
    request: jest.fn(async (command: string, data: string) => {
      // command = pid(00) cmdLen(09) CLA INS P1 P2 ...; data ends with a 1-byte XOR checksum.
      const header = command.slice(4, 12).toUpperCase();
      const body = data.slice(0, -2).toUpperCase();
      sent.push({ header, data: body });
      const answer = answers[header];
      if (answer instanceof Error) throw answer;
      if (answer) return answer;
      if (header.startsWith('00A4')) {
        selected = body;
        return '9000';
      }
      if (header === '80CA00E0') return keyInfoOf(selected === SSD_AID ? ssdKvn : isdKvn) + '9000';
      if (/^(8050|8482|84D8)/.test(header)) return 'CAFE' + header.slice(2, 4) + '009000';
      return '9000';
    }),
  } as unknown as Transport;
  // The key rotation commands, after the two key information reads
  const sessionCommands = () => sent.slice(4).map(({ header, data }) => header + data);
  return { transport, sent, sessionCommands };
};

const apduWithoutLengths = (apdu: string) => {
  const lc = parseInt(apdu.slice(8, 10), 16);
  return apdu.slice(0, 8) + apdu.slice(10, 10 + lc * 2);
};

const params = (transport: Transport, callAPI: jest.Mock) => ({
  transport,
  cardId: 'CWP600000',
  apiSecret: 'secret',
  callAPI,
});

describe('rotateKey', () => {
  it('relays every command of a Pro flow between the API and the card', async () => {
    const api = fakeApi();
    const card = fakeCard();
    const progressCallback = jest.fn();
    await expect(rotateKey({ ...params(card.transport, api.callAPI), progressCallback })).resolves.toBe(true);

    // Each session: its SELECT, then its commands, nothing else in between
    const expected = PRO_PLAN.flatMap(({ select, apdus }) => [select, ...apdus].map(apduWithoutLengths));
    expect(card.sessionCommands()).toEqual(expected);
    expect(card.sent.map(({ header }) => header)).not.toContain('7F800000'); // no SE power off

    expect(api.endpoints()).toEqual([
      'flows',
      ...PRO_PLAN.flatMap(({ apdus }) => ['sessions', ...apdus.map(() => 'responses')]),
    ]);
    expect(api.calls[0].payload).toMatchObject({
      cwid: 'CWP600000',
      ssdKeyInfo: keyInfoOf('0A') + '9000',
      isdKeyInfo: keyInfoOf('01') + '9000',
    });
    expect(api.submitted[0]).toEqual({ step: 0, response: 'CAFE50009000' });
    expect(progressCallback.mock.calls).toEqual([
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ]);
  });

  it('skips the API when both keys are already rotated', async () => {
    const api = fakeApi();
    const card = fakeCard({ ssdKvn: '0B', isdKvn: '02' });
    await expect(rotateKey(params(card.transport, api.callAPI))).resolves.toBe(false);
    expect(api.callAPI).not.toHaveBeenCalled();
    expect(card.sent).toHaveLength(4); // the two key information reads
  });

  it('runs a flow when only one key is left', async () => {
    const api = fakeApi(PRO_PLAN.slice(1));
    const card = fakeCard({ ssdKvn: '0B', isdKvn: '01' });
    await expect(rotateKey(params(card.transport, api.callAPI))).resolves.toBe(true);
    expect(api.calls[0].payload).toMatchObject({ ssdKeyInfo: keyInfoOf('0B') + '9000' });
  });

  it('rejects other card types before touching the card', async () => {
    const api = fakeApi();
    const card = fakeCard({ cardType: CardType.Go });
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('not supported');
    expect(card.transport.request).not.toHaveBeenCalled();
  });

  it('resends a response after a temporary error without sending the command to the card again', async () => {
    const api = fakeApi(PRO_PLAN, {
      responses: [{ status: 409, body: { error: { code: '40913', message: 'busy', retryAfter: 1 } } }],
    });
    const card = fakeCard();
    await expect(rotateKey(params(card.transport, api.callAPI))).resolves.toBe(true);
    expect(card.sessionCommands().filter((c) => c === apduWithoutLengths(INIT_UPDATE))).toHaveLength(4);
    expect(api.endpoints().filter((e) => e === 'responses')).toHaveLength(11 + 1);
  });

  it.each([
    ['a request that did not arrive', new Error('network down')],
    ['a request whose answer was lost', 'drop' as const],
  ])('resends %s without sending the command to the card again', async (_, fault) => {
    const api = fakeApi(PRO_PLAN, { responses: [fault], sessions: [fault] });
    const card = fakeCard();
    await expect(rotateKey(params(card.transport, api.callAPI))).resolves.toBe(true);
    expect(card.sessionCommands()).toHaveLength(PRO_PLAN.reduce((n, session) => n + 1 + session.apdus.length, 0));
    expect(api.submitted).toHaveLength(11);
  });

  it('gives up after three attempts and cancels the flow', async () => {
    const lost = new Error('network down');
    const api = fakeApi(PRO_PLAN, { responses: [lost, lost, lost] });
    const card = fakeCard();
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('network down');
    expect(api.endpoints()).toEqual(['flows', 'sessions', 'responses', 'responses', 'responses', 'cancel']);
    expect(card.sessionCommands()).toEqual([SELECT_SSD, INIT_UPDATE].map(apduWithoutLengths));
  });

  it('stops at an error that ends the flow, without resending', async () => {
    const api = fakeApi(PRO_PLAN, {
      responses: [{ status: 422, body: { error: { code: '42210', message: 'card error', sw: '6982' } } }],
    });
    const card = fakeCard();
    const error = await rotateKey(params(card.transport, api.callAPI)).catch((e) => e);
    expect(error).toBeInstanceOf(KeyRotationAPIError);
    expect(error).toMatchObject({ code: '42210', sw: '6982', isFlowFatal: true });
    expect(api.endpoints()).toEqual(['flows', 'sessions', 'responses', 'cancel']);
  });

  it('reports a failing status word to the API instead of throwing', async () => {
    const api = fakeApi();
    const card = fakeCard({ answers: { '84821100': '6982' } });
    await rotateKey(params(card.transport, api.callAPI));
    expect(api.submitted[1]).toEqual({ step: 1, response: '6982' });
  });

  it('cancels the flow when the card connection fails', async () => {
    const api = fakeApi();
    const card = fakeCard({ answers: { '84D80A81': new Error('BLE disconnected') } });
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('BLE disconnected');
    expect(api.endpoints()).toEqual(['flows', 'sessions', 'responses', 'responses', 'cancel']);
  });

  it('does not send the session to another applet when SELECT fails', async () => {
    const api = fakeApi();
    const card = fakeCard({ answers: { '00A40400': '6A82' } });
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('returnCode: 6A82');
    expect(api.callAPI).not.toHaveBeenCalled(); // the key information reads select too
  });

  it('cancels the flow when the session SELECT fails', async () => {
    const api = fakeApi();
    let selects = 0;
    const card = fakeCard();
    const request = card.transport.request as jest.Mock;
    const original = request.getMockImplementation() as (c: string, d: string) => Promise<string>;
    request.mockImplementation(async (command: string, data: string) => {
      if (command.slice(4, 12).toUpperCase() === '00A40400') {
        selects += 1;
        if (selects === 3) return '6A82'; // the first SELECT of the flow
      }
      return original(command, data);
    });
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('SELECT of the ssd failed: 6A82');
    expect(api.endpoints()).toEqual(['flows', 'sessions', 'cancel']);
    expect(request).toHaveBeenCalledTimes(5); // the two key information reads and the SELECT, no INITIALIZE UPDATE
  });

  it('still throws the original error when cancelling fails', async () => {
    const api = fakeApi(PRO_PLAN, { cancel: [new Error('cancel failed')] });
    const card = fakeCard({ answers: { '84D80A81': new Error('BLE disconnected') } });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(rotateKey(params(card.transport, api.callAPI))).rejects.toThrow('BLE disconnected');
    warn.mockRestore();
  });
});
