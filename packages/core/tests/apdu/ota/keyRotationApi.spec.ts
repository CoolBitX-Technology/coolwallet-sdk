import { createHmac } from 'crypto';
import {
  KeyRotationAPIError,
  cancelKeyRotationFlow,
  createKeyRotationFlow,
  getKeyRotationFlowStatus,
  startKeyRotationSession,
  submitKeyRotationResponse,
} from '../../../src/apdu/ota/keyRotationApi';
import type { APIOptions } from '../../../src/apdu/ota/types';

const SECRET = 'test-secret';
const CARD_ID = 'CWP600000';
const BASE = 'https://vas.wallet.cbx.io/ota/api/key-rotation';

const fromBase64Url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

// Verifies the HS256 signature and returns the JWT payload.
const decodeJwt = (token: string) => {
  const [header, payload, signature] = token.split('.');
  const expected = createHmac('sha256', SECRET).update(`${header}.${payload}`).digest();
  expect(fromBase64Url(signature).equals(expected)).toBe(true);
  return JSON.parse(fromBase64Url(payload).toString());
};

const responseOf = (status: number, body: unknown) =>
  ({
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response);

const mockApi = (status = 200, body: unknown = {}) => {
  const callAPI = jest.fn<Promise<Response>, [string, APIOptions]>(async () => responseOf(status, body));
  const params = { cardId: CARD_ID, apiSecret: SECRET, callAPI };
  const sentPayload = () => {
    const options = callAPI.mock.calls[0][1];
    expect(options.method).toBe('POST');
    const sentBody = JSON.parse(options.body);
    expect(Object.keys(sentBody)).toEqual(['payload']);
    return decodeJwt(sentBody.payload);
  };
  return { callAPI, params, sentPayload };
};

describe('key rotation API requests', () => {
  it('creates a flow with the key information', async () => {
    const flow = { flowId: 'f1', expiresAt: '', sessions: [], next: { domain: 'ssd' } };
    const { callAPI, params, sentPayload } = mockApi(200, flow);
    await expect(createKeyRotationFlow(params, 'E0019000', 'E0029000')).resolves.toEqual(flow);
    expect(callAPI.mock.calls[0][0]).toBe(`${BASE}/flows`);
    expect(sentPayload()).toMatchObject({ cwid: CARD_ID, ssdKeyInfo: 'E0019000', isdKeyInfo: 'E0029000' });
  });

  it('starts a session', async () => {
    const { callAPI, params, sentPayload } = mockApi(200, { status: 'continue' });
    await startKeyRotationSession(params, 'f1');
    expect(callAPI.mock.calls[0][0]).toBe(`${BASE}/flows/f1/sessions`);
    expect(sentPayload()).toMatchObject({ cwid: CARD_ID });
  });

  it('submits a card response with its step', async () => {
    const { callAPI, params, sentPayload } = mockApi(200, { status: 'done' });
    await submitKeyRotationResponse(params, 'f1', 's1', 1, '6982');
    expect(callAPI.mock.calls[0][0]).toBe(`${BASE}/flows/f1/sessions/s1/responses`);
    expect(sentPayload()).toMatchObject({ cwid: CARD_ID, step: 1, response: '6982' });
  });

  it('gets the status and cancels a flow', async () => {
    const { callAPI, params } = mockApi(200, { flowId: 'f1' });
    await getKeyRotationFlowStatus(params, 'f1');
    await cancelKeyRotationFlow(params, 'f1');
    expect(callAPI.mock.calls.map(([url]) => url)).toEqual([`${BASE}/flows/f1/status`, `${BASE}/flows/f1/cancel`]);
  });

  it('uses the given base URL and escapes ids in the path', async () => {
    const { callAPI, params } = mockApi();
    await startKeyRotationSession({ ...params, baseUrl: 'http://localhost:2000/ota/api/key-rotation' }, '../x');
    expect(callAPI.mock.calls[0][0]).toBe('http://localhost:2000/ota/api/key-rotation/flows/..%2Fx/sessions');
  });

  it('requires the API secret', async () => {
    const { callAPI, params } = mockApi();
    await expect(startKeyRotationSession({ ...params, apiSecret: '' }, 'f1')).rejects.toThrow('API Secret is required');
    expect(callAPI).not.toHaveBeenCalled();
  });
});

describe('key rotation API errors', () => {
  it('reads the error body', async () => {
    const { params } = mockApi(422, { error: { code: '42210', message: 'Card returned an error', sw: '6982' } });
    const error = await startKeyRotationSession(params, 'f1').catch((e) => e);
    expect(error).toBeInstanceOf(KeyRotationAPIError);
    expect(error).toMatchObject({ httpStatus: 422, code: '42210', sw: '6982', isFlowFatal: true, isRetryable: false });
    expect(error.message).toContain('code: 42210');
  });

  it('marks temporary errors as retryable', async () => {
    const { params } = mockApi(409, { error: { code: '40913', message: 'busy', retryAfter: 1 } });
    await expect(startKeyRotationSession(params, 'f1')).rejects.toMatchObject({
      code: '40913',
      retryAfter: 1,
      isFlowFatal: false,
      isRetryable: true,
    });
  });

  it('reads the error of the JWT check', async () => {
    const { params } = mockApi(401, { code: '40101', message: 'Missing authentication token' });
    await expect(startKeyRotationSession(params, 'f1')).rejects.toMatchObject({ httpStatus: 401, code: '40101' });
  });

  it('keeps a non-JSON error page', async () => {
    const { params } = mockApi(403, '<html>Forbidden</html>');
    const error = await startKeyRotationSession(params, 'f1').catch((e) => e);
    expect(error).toMatchObject({ httpStatus: 403, code: '' });
    expect(error.message).toContain('<html>Forbidden</html>');
  });

  it('rejects a success response that is not JSON', async () => {
    const { params } = mockApi(200, 'ok');
    await expect(startKeyRotationSession(params, 'f1')).rejects.toThrow('unexpected body: ok');
  });
});
