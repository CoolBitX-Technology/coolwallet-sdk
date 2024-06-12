import { TOKENS } from './token';
import { ChainProps } from '../types';

class PolygonChain extends ChainProps {
  id = 137;
  symbol = 'MATIC';
  signature =
    `30450221008d9a2ecb25c6debb817709fe6ac7b83d48e43b93d789d45ba803be59ea15904f022048579648bc83e84c55d127a2b845d3c6f41ea418752a131f179a048e3f26212f`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new PolygonChain();
