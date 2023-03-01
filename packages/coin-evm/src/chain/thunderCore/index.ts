import { TOKENS, TEST_TOKENS } from './token';
import { ChainProps } from '../types';

class ThunderCore extends ChainProps {
  id = 108;
  symbol = 'TT';
  signature = `FA`.padEnd(144, '0');
  tokens = TOKENS;
}

class ThunderCoreTest extends ChainProps {
  id = 18;
  symbol = 'TST';
  signature = `FA`.padEnd(144, '0');
  tokens = TEST_TOKENS;
}

export const THUNDERCORE = new ThunderCore();
export const THUNDERCORE_TEST = new ThunderCoreTest();
