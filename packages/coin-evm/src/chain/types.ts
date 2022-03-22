interface TokenProps {
  name: string;
  symbol: string;
  unit: string;
  contractAddress: string;
  signature: string;
}

abstract class ChainProps {
  abstract readonly id: number;
  abstract readonly symbol: string;
  abstract readonly signature: string;
  abstract readonly tokens: Record<string, TokenProps>;

  getSignature() {
    return this.signature;
  }

  toHexChainInfo() {
    const chainIdHex = this.getChainId();
    const chainIdLength = Math.ceil(chainIdHex.length / 2)
      .toString(16)
      .padStart(2, '0');
    const symbolHex = this.getSymbol();
    const symbolLength = (symbolHex.length / 2).toString(16).padStart(2, '0');
    return chainIdLength + chainIdHex.padEnd(12, '0') + symbolLength + symbolHex.padEnd(14, '0');
  }

  private getSymbol() {
    return Buffer.from(this.symbol).toString('hex');
  }

  private getChainId() {
    const buffer = Buffer.allocUnsafe(6);
    buffer.writeIntBE(this.id, 0, 6);
    // Remove leading zeros.
    return buffer.toString('hex').replace(/^0+/, '');
  }
}

export { ChainProps, TokenProps };
