import { TOKENS } from './token';
import { ChainProps } from '../types';

class GoreliChain extends ChainProps {
  id = 5;
  symbol = 'ETH';
  signature =
    `30450220313819cff788cf9e4e93ce2978b3bf605f2482a8524c6e2886c80b5b968e7bd70221008e444fffbea45dd94e4cdbc1db759fd23ace27b0ee34c5ec47f406b94ade6e2e`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new GoreliChain();
