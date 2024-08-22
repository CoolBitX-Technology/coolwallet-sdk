import { TOKENS } from './token';
import { ChainProps } from '../types';

class PolygonChain extends ChainProps {
  id = 137;
  symbol = 'POL';
  signature =
    `3044022061fc28a961fc34520960442a878b11f8baf122a4f55e4cd14594045b7424af6102206af31c36928e9fc9b6f9181e2bde2061bf40ace65464f5c0683a3d72a23fed1d`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new PolygonChain();
