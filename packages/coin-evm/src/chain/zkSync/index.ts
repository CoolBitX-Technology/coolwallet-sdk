import { TOKENS } from './token';
import { ChainProps } from '../types';

class zkSynChain extends ChainProps {
  id = 324;
  symbol = 'ETH';
  layer2 = 'ZKS';
  signature =
    `304502203a3477bd4eb58b2172e75324448d447fa2434f941ecb42a4dfa5effb969da4b7022100a8d17c2a636cac9fdc744739675b62a555ea56815aff496397e04e6e4363c78d`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new zkSynChain();
