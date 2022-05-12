import { TOKENS } from './token';
import { ChainProps } from '../types';

class CronosChain extends ChainProps {
  id = 25;
  symbol = 'CRO';
  signature =
    `3044022013f66abf4bf4805517112cd4d9eee36674fe1e62ef624ee063384050768ff55402205e150be70d81064cb11d1831a768647ad8e349863adefdc23704794f10dc11cb`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new CronosChain();
