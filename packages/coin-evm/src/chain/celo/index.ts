import { TOKENS, TEST_TOKENS } from './token';
import { ChainProps } from '../types';

class CeloChain extends ChainProps {
  id = 42220;
  symbol = 'CELO';
  signature = `FA`.padEnd(144, '0');
  tokens = TOKENS;
}

class CeloTestChain extends ChainProps {
  id = 44787;
  symbol = 'CELO';
  signature = `FA`.padEnd(144, '0');
  tokens = TEST_TOKENS;
}

export const CELO = new CeloChain();
export const CELO_TEST = new CeloTestChain();

