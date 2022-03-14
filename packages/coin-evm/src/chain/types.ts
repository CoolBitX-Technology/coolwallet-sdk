interface TokenProps {
  name: string;
  symbol: string;
  unit: string;
  contractAddress: string;
  signature: string;
}

interface ChainProps {
  id: number;
  symbol: string;
  signature: string;
  tokens: Record<string, TokenProps>;
  getSignature(): string;
  toHexChainInfo(): string;
}

export { ChainProps, TokenProps };
