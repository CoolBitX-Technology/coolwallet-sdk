import { TOKENS } from './token';
import { ChainProps } from '../types';

class ArbitrumChain extends ChainProps {
  id = 250;
  symbol = 'FTM';
  signature = `3044022068280439c1764f3a176a4c4085d3e8a3783e9c434fe8350b4f3228a9845ff0a10220417d7b77f4c28e3bf521e836660cb7e5c43e44b3618495911f0f8652f4ed86b69000`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
}

export default new ArbitrumChain();
