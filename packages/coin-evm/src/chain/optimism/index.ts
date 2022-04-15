import { TOKENS } from './token';
import { ChainProps } from '../types';

class OptimismChain extends ChainProps {
  id = 10;
  symbol = 'ETH';
  signature =
    `3045022100AD19E1C1C291D04844D00B89223961B53BC2D8508582A2B5A71A11EDB0BD829D022076F5EA80B9552E84734B1544ACC1A6EB456475A653320643C5C913E54E37EE6F`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new OptimismChain();
