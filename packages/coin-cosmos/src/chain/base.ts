import { utf8ToHex, getHexBufferLength } from './utils';

type ScriptKinds = 'TRANSFER' | 'DELEGATE' | 'UNDELEGATE' | 'WITHDRAW';

interface TokenProps {
  name: string;
  symbol: string;
  unit: string;
  contractAddress: string;
  signature: string;
}

interface ScriptProps {
  script: string;
  signature: string;
  scriptWithSignature: string;
}

class CoinProps {
  constructor(
    private readonly denom: string,
    private readonly symbol: string,
    private readonly decimal: number,
    private readonly signature: string
  ) {}

  getSignature(): string {
    return this.signature;
  }

  getDenom(): string {
    return this.denom;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getDecimal(): number {
    return this.decimal;
  }

  /**
   * [Decimal(1B)][Denom(10B)][Symbol(7B)]
   * @returns {string}
   */
  toHexCoinInfo(): string {
    const decimalHex = this.decimal.toString(16).padStart(2, '0');
    const denomHex = utf8ToHex(this.denom);
    const symbolHex = utf8ToHex(this.symbol);
    return decimalHex + denomHex.padStart(20, '0') + symbolHex.padStart(14, '0');
  }
}

class ChainProps {
  constructor(
    private readonly id: string,
    private readonly symbol: string,
    private readonly coinType: string,
    private readonly prefix: string,
    private readonly signature: string,
    private readonly scripts: Record<ScriptKinds, ScriptProps>,
    private readonly coins: Record<string, CoinProps>,
    private readonly tokens: Record<string, TokenProps>
  ) {}

  getChainId(): string {
    return this.id;
  }

  isChainId(chainId: string): boolean {
    return this.id === chainId;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getScripts(): Record<ScriptKinds, ScriptProps> {
    return this.scripts;
  }

  /**
   * Get coinType which is specify in BIP 44.
   * 
   * @returns {string}
   */
  getCoinType(): string {
    return this.coinType;
  }

  /**
   * Get address prefix of cosmos sdk.
   * @returns {string}
   */
  getPrefix(): string {
    return this.prefix;
  }

  getSignature(): string {
    return this.signature;
  }

  getCoins(): Record<string, CoinProps> {
    return this.coins;
  }

  /**
   * Retrieve coin from denom string.
   * 
   * @param denom denom string
   * @returns {CoinProps | null}
   */
  getCoin(denom: string): CoinProps | null {
    return this.coins[denom];
  }

  /**
   * Retrieve native coin(token).
   * @returns {CoinProps}
   */
  getNativeCoin(): CoinProps {
    throw new Error('Unimplemented');
  }

  /**
   * [chainIdLength(1B)][chainId(50B)][symbolLength(1b)][symbol(7B)]
   * @returns {string}
   */
  toHexChainInfo(): string {
    const chainIdHex = utf8ToHex(this.id);
    const chainIdLength = getHexBufferLength(chainIdHex);
    const symbolHex = utf8ToHex(this.symbol);
    const symbolLength = getHexBufferLength(symbolHex);
    return chainIdLength + chainIdHex.padEnd(100, '0') + symbolLength + symbolHex.padEnd(14, '0');
  }
}

export { ChainProps, CoinProps, TokenProps, ScriptKinds, ScriptProps };
