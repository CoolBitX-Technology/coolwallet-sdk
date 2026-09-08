import { addressToOutScript } from '../src/utils/transactionUtil';
import { ScriptType } from '../src/config/types';

// Addresses derived from pubkey 02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5 on LTC mainnet
const ADDRS = {
  p2pkh: 'LKqJxEKxN7SnCEpj3ia3Z9DuAD1HNjh1hx',
  p2sh: 'MMiRb7TPSoqLtRpfTjc9FGQRQcW8WLeirF',
  p2wpkh: 'ltc1qq6hag67dl53wl99vzg42z8eyzfz2xlkvz9zn23',
  p2wsh: 'ltc1qf0pt5luwtakgzezxlf2h44nunthplgkv2h2duxxgt6jpq69l4rvs0wn0wv',
};

describe('addressToOutScript', () => {
  it('P2PKH: L-prefix address → scriptType P2PKH with 20-byte hash', () => {
    expect(ADDRS.p2pkh.startsWith('L')).toBe(true);
    const result = addressToOutScript(ADDRS.p2pkh);
    expect(result.scriptType).toBe(ScriptType.P2PKH);
    expect(result.outScript.length).toBeGreaterThan(0);
    expect(result.outHash?.length).toBe(20);
  });

  it('P2SH_P2WPKH: M-prefix address → scriptType P2SH_P2WPKH with 20-byte hash', () => {
    expect(ADDRS.p2sh.startsWith('M')).toBe(true);
    const result = addressToOutScript(ADDRS.p2sh);
    expect(result.scriptType).toBe(ScriptType.P2SH_P2WPKH);
    expect(result.outScript.length).toBeGreaterThan(0);
    expect(result.outHash?.length).toBe(20);
  });

  it('P2WPKH: ltc1q address (43 chars) → scriptType P2WPKH with 20-byte hash', () => {
    expect(ADDRS.p2wpkh.startsWith('ltc1q')).toBe(true);
    expect(ADDRS.p2wpkh.length).toBe(43);
    const result = addressToOutScript(ADDRS.p2wpkh);
    expect(result.scriptType).toBe(ScriptType.P2WPKH);
    expect(result.outScript.length).toBeGreaterThan(0);
    expect(result.outHash?.length).toBe(20);
  });

  it('P2WSH: ltc1q address (63 chars) → scriptType P2WSH with 32-byte hash', () => {
    expect(ADDRS.p2wsh.startsWith('ltc1q')).toBe(true);
    expect(ADDRS.p2wsh.length).toBe(63);
    const result = addressToOutScript(ADDRS.p2wsh);
    expect(result.scriptType).toBe(ScriptType.P2WSH);
    expect(result.outScript.length).toBeGreaterThan(0);
    expect(result.outHash?.length).toBe(32);
  });

  it('unsupported address → throws', () => {
    expect(() => addressToOutScript('1BpEi6DfDAUFd153wiGrvkiKW1ECQ8cdNX')).toThrow();
  });
});
