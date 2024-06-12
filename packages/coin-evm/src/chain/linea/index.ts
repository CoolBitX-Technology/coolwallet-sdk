import { TOKENS } from './token';
import { ChainProps } from '../types';

class LineaChain extends ChainProps {
  id = 59144;
  symbol = 'ETH';
  layer2 = 'LINEA';
  signature =
    `30460221009cb5780ecf9506e4cb92cfff841e2e128b72283577a0eca0df6b208c965d1db2022100ca8da27c9326366835435cd23b4ff135128d022a6e6b73cd70f53410cc638b1a`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new LineaChain();
