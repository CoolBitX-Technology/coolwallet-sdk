import { SDKError } from '../../error/errorHandle';
import jwt from '../../utils/jwt';
import { KEY_ROTATION_URL } from './constants';
import type {
  APIOptions,
  KeyRotationErrorBody,
  KeyRotationFlow,
  KeyRotationFlowStatus,
  KeyRotationStep,
} from './types';

/**
 * Calls of the key rotation API (cp-ota-api-v2 docs/key-rotation-api.md). Every request is a POST
 * whose body is { payload: <HS256 JWT> }, the JWT carrying cwid and the request fields.
 * These only call the API: they send nothing to the card and never retry.
 */

interface KeyRotationApiParams {
  cardId: string;
  apiSecret: string;
  // Same as updateSE: a fetch-like function returning a Response
  callAPI: (url: string, options: APIOptions) => Promise<Response>;
  // Defaults to the production API
  baseUrl?: string;
}

// After one of these the flow is closed: read the key information again and create a new flow,
// or stop for 40916 and 50310. Never retry automatically (docs section 1.4).
const FLOW_FATAL_CODES = new Set([
  '40310',
  '40311',
  '40313',
  '40915',
  '40916',
  '40918',
  '42210',
  '42212',
  '50211',
  '50310',
]);

// Temporary: resend the same request later (docs section 4).
const RETRYABLE_CODES = new Set(['40913', '42910', '50010', '50210']);

export class KeyRotationAPIError extends SDKError {
  readonly httpStatus: number;

  readonly code: string;

  readonly sw?: string;

  readonly retryAfter?: number;

  constructor(name: string, httpStatus: number, body: Partial<KeyRotationErrorBody>) {
    const code = body.code ?? '';
    const sw = body.sw ? `, sw: ${body.sw}` : '';
    super(name, `key rotation API failed, http status: ${httpStatus}, code: ${code}, message: ${body.message}${sw}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.httpStatus = httpStatus;
    this.code = code;
    this.sw = body.sw;
    this.retryAfter = body.retryAfter;
  }

  // The flow cannot continue; it needs a new flow from freshly read key information, or none at all
  get isFlowFatal(): boolean {
    return FLOW_FATAL_CODES.has(this.code);
  }

  // A temporary error: the same request can be sent again after retryAfter seconds
  get isRetryable(): boolean {
    return RETRYABLE_CODES.has(this.code);
  }
}

const readBody = async (response: Response): Promise<unknown> => {
  // updateSE only needs json(), so an App's callAPI may not return a full Response
  if (typeof response.text !== 'function') return response.json();
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // e.g. the HTML page of a gateway or firewall
    return text;
  }
};

// Key rotation errors are { error: { code, message, sw?, retryAfter? } }; the JWT check before
// them answers { code, message } or a bare status.
const errorBodyOf = (body: unknown): Partial<KeyRotationErrorBody> => {
  if (body && typeof body === 'object') {
    const { error } = body as { error?: Partial<KeyRotationErrorBody> };
    if (error && typeof error === 'object') return error;
    const { code, message } = body as Partial<KeyRotationErrorBody>;
    if (code !== undefined || message !== undefined) {
      return { code: code === undefined ? undefined : String(code), message };
    }
  }
  return { message: typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body) };
};

const post = async <T>(
  name: string,
  { cardId, apiSecret, callAPI, baseUrl = KEY_ROTATION_URL }: KeyRotationApiParams,
  path: string,
  fields: Record<string, string | number> = {}
): Promise<T> => {
  if (!apiSecret) throw new SDKError(name, 'API Secret is required');
  const options: APIOptions = {
    body: JSON.stringify({ payload: jwt({ ...fields, cwid: cardId }, apiSecret) }),
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  const response = await callAPI(baseUrl + path, options);
  const body = await readBody(response);
  if (response.status !== 200) {
    throw new KeyRotationAPIError(name, response.status, errorBodyOf(body));
  }
  if (!body || typeof body !== 'object') {
    throw new SDKError(name, `key rotation API returned an unexpected body: ${String(body).slice(0, 200)}`);
  }
  return body as T;
};

const flowPath = (flowId: string) => `/flows/${encodeURIComponent(flowId)}`;

/**
 * Create a key rotation flow from key information just read from the card (getKeyInfo).
 * The flow expires in 5 minutes; creating another one for the card replaces it.
 */
export const createKeyRotationFlow = (
  params: KeyRotationApiParams,
  ssdKeyInfo: string,
  isdKeyInfo: string
): Promise<KeyRotationFlow> => post(createKeyRotationFlow.name, params, '/flows', { ssdKeyInfo, isdKeyInfo });

/**
 * Start the next session and get its first command. Called again while a session is open,
 * it returns the command the session is waiting for.
 */
export const startKeyRotationSession = (params: KeyRotationApiParams, flowId: string): Promise<KeyRotationStep> =>
  post(startKeyRotationSession.name, params, `${flowPath(flowId)}/sessions`);

/**
 * Report the card's response (data ‖ SW, whatever the SW) to the command of the given step,
 * and get the next command. Sending the same step and response again gives the same result.
 */
export const submitKeyRotationResponse = (
  params: KeyRotationApiParams,
  flowId: string,
  sessionId: string,
  step: number,
  response: string
): Promise<KeyRotationStep> =>
  post(
    submitKeyRotationResponse.name,
    params,
    `${flowPath(flowId)}/sessions/${encodeURIComponent(sessionId)}/responses`,
    {
      step,
      response,
    }
  );

export const getKeyRotationFlowStatus = (
  params: KeyRotationApiParams,
  flowId: string
): Promise<KeyRotationFlowStatus> => post(getKeyRotationFlowStatus.name, params, `${flowPath(flowId)}/status`);

export const cancelKeyRotationFlow = (
  params: KeyRotationApiParams,
  flowId: string
): Promise<{ flowId: string; cancelled: boolean }> =>
  post(cancelKeyRotationFlow.name, params, `${flowPath(flowId)}/cancel`);

export type { KeyRotationApiParams };
