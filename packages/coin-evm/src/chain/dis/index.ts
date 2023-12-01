import { TOKENS } from './token';
import { ChainProps } from '../types';

class DisChain extends ChainProps {
  id = 513100;
  symbol = 'DIS';
  signature =
    `3046022100c3ab1871a1de4473f536a5018de069dca600815e7909a98f2ba59be2d65679d6022100e2b1c46fefbda267eea6902866f9834dca503a7cee0f905ebf6f90f7f15bb01c`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new DisChain();
