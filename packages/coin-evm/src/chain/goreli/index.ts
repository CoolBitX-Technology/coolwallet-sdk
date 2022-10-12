import { TOKENS } from './token';
import { ChainProps } from '../types';

class VelasChain extends ChainProps {
  id = 5;
  symbol = 'ETH';
  signature =
    `30450220056376379d62cc38c66f7c3ad654a96d6b2fd0bd787e3fff7c23f8085546a983022100bdbd04ff0fc76f3ed83ec670ce18b0eac5b26294f7b59e9b1d19b5ed16f2046e`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new VelasChain();
