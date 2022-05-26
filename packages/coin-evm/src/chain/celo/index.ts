import { TOKENS } from './token';
import { ChainProps } from '../types';

class CeloChain extends ChainProps {
  id = 42220;
  symbol = 'CELO';
  signature = `FA`.padEnd(144, '0');
  tokens = TOKENS;
}

export default new CeloChain();
