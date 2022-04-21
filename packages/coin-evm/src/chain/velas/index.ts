import { TOKENS } from './token';
import { ChainProps } from '../types';

class VelasChain extends ChainProps {
  id = 106;
  symbol = 'VLX';
  signature = `3044022050c6a0d4cd19f2092d2aee66e8bf664970ddb54d4e8f61712f3b14288718d449022033fe2b8ef8d15b81d977e0205fc7f7361628198e1f4e9445738b0deebdf17d94`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
}

export default new VelasChain();
