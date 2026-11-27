import type { CommandType } from '../execute/command';

interface AppletStatus {
  status: boolean;
  statusCode: string;
}

interface SEUpdateInfo {
  isNeedUpdate: boolean;
  curVersion: number;
  newVersion: number;
}

interface APIOptions {
  body: string;
  method: string;
  headers: {
    Accept: string;
    'Content-Type': string;
  };
}

type Command = {
  packets: string;
} & CommandType;

interface KeyInfo {
  // GET DATA (80CA00E0) responses of the two security domains, data ‖ SW in hex
  ssdKeyInfo: string;
  isdKeyInfo: string;
  // The domain still has the keys the card was issued with (SSD KVN 0x0A, ISD KVN 0x01)
  isNeedRotateSsdKey: boolean;
  isNeedRotateIsdKey: boolean;
}

// Key rotation API (cp-ota-api-v2 docs/key-rotation-api.md)
type SecurityDomain = 'ssd' | 'isd';
type KeyRotationFlowState = 'ACTIVE' | 'DONE' | 'FAILED';

interface KeyRotationPlannedSession {
  domain: SecurityDomain;
  // Empty: the session only authenticates
  steps: string[];
}

interface KeyRotationFlow {
  flowId: string;
  expiresAt: string;
  sessions: KeyRotationPlannedSession[];
  next: { domain: SecurityDomain };
}

interface KeyRotationStep {
  flowId: string;
  sessionId: string;
  domain: SecurityDomain;
  status: 'continue' | 'done';
  // SELECT of the session's security domain, with step 0 only. Send it first; its response is not reported.
  select?: string;
  // With status continue: the command to send to the card and its step number to report the response with
  step?: number;
  apdu?: string;
  flowState: KeyRotationFlowState;
  // The security domain of the next session, when the flow has one left
  next?: { domain: SecurityDomain };
}

interface KeyRotationErrorBody {
  code: string;
  message: string;
  sw?: string;
  retryAfter?: number;
}

interface KeyRotationFlowStatus {
  flowId: string;
  flowState: KeyRotationFlowState;
  expiresAt: string;
  sessions: KeyRotationPlannedSession[];
  completedSessions: number;
  error?: KeyRotationErrorBody;
  // The pending command of the open session; call startKeyRotationSession to get it again
  session: { sessionId: string; domain: SecurityDomain; step: number; kind: string } | null;
}

export type {
  AppletStatus,
  SEUpdateInfo,
  Command,
  APIOptions,
  KeyInfo,
  SecurityDomain,
  KeyRotationFlowState,
  KeyRotationPlannedSession,
  KeyRotationFlow,
  KeyRotationStep,
  KeyRotationErrorBody,
  KeyRotationFlowStatus,
};
