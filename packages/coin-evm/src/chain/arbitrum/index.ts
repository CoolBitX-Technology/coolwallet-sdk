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

class ArbitrumSepoliaChain extends ChainProps {
  id = 421614;
  symbol = 'ETH';
  layer2 = 'ARB';
  signature =
    `304502210081e943d7a9130428360d26de206a2298e365dcfcacc38bcde6e0068f6e39a97802207291e17af07d6ca55f1049b7a3799a72a4f578a24dbf490ba682b56bce5fed78`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export const ARBITRUM = new ArbitrumChain();
export const ARBITRUM_TEST = new ArbitrumSepoliaChain();
