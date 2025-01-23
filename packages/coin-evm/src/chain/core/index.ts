import { TOKENS } from './token';
import { ChainProps } from '../types';

class CoreChain extends ChainProps {
  id = 1116;
  symbol = 'CORE';
  signature = // TODO: Core Chain
    ``.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new CoreChain();
