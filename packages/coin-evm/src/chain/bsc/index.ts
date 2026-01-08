import { ChainProps } from '../types';
import { TOKENS } from './token';

class BSCChain extends ChainProps {
  id = 56;
  symbol = 'BSC';
  signature =
    `3044022021ff7ab9540f61facf0ad21ca14998af4353005205063945bf6ead91cbe524e5022022dd11e37cd6b56fc6c301f060c9c6c2c3147988d6af4d3a36c0b639e30a2eee`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new BSCChain();
