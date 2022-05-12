import { TOKENS } from './token';
import { ChainProps } from '../types';

class ArbitrumChain extends ChainProps {
  id = 42161;
  symbol = 'ETH';
  layer2 = 'ARB';
  signature =
    `3045022100efb77767649046d950f1c9ef30372c8826ecc0c32ae3b82c847bd778131f0522022078910bbacd4cb3f4ed39c36592882e94eb0811551fe37a49edba8caa27f90266`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new ArbitrumChain();
