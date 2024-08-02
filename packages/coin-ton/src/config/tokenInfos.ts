export interface Token {
  name: string;
  symbol: string;
  unit: string;
  contractAddress: string;
  signature: string;
}

export const TOKENS: Record<string, Token> = {
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    unit: '6',
    contractAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    signature: `3046022100c7468bffe48a52395b2180c9e15bd32d20164ac50e2b9b135b02587c45201e20022100a06249f84783796d31b96c508da23680add7f7ddd7b5d68e9ae1489a9407f9bc`,
  },
  NOT: {
    name: 'Notcoin',
    symbol: 'NOT',
    unit: '9',
    contractAddress: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT',
    signature: `3044022055f330afc6bec928f9d59d928a71c2fc3913c8316dea48c63562593692e53b770220328cff664ca1f6cae83681d32d2fcbabd07b33d7b82f56686e33d92c49123666`,
  },
};
