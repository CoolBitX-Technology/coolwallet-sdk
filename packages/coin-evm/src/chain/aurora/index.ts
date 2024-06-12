import { TOKENS, TEST_TOKENS } from './token';
import { ChainProps } from '../types';

class AuroraChain extends ChainProps {
  id = 1313161554;
  symbol = 'AURORA';
  signature = 'FA'.padEnd(144, '0');
  tokens = TOKENS;
}

class AuroraTestChain extends ChainProps {
  id = 1313161555;
  symbol = 'AURORA';
  signature = 'FA'.padEnd(144, '0');
  tokens = TEST_TOKENS;
}

export const AURORA = new AuroraChain();
export const AURORA_TEST = new AuroraTestChain();