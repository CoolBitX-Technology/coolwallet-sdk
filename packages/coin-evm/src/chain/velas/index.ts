import { TOKENS } from './token';
import { ChainProps } from '../types';

class ArbitrumChain extends ChainProps {
  id = 106;
  symbol = 'VLX';
  signature = `3046022100b07b1e2302f5a7d44de8dd035b8a0f55ad2db0a3424cb5fa5b91a04de2aca2a60221009729a7cf75ab1dcf5a69041f1d2d2fdb3817fa431501497c66e2b9f4d8dd15a59000`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
}

export default new ArbitrumChain();
