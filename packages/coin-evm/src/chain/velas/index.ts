import { TOKENS } from './token';
import { ChainProps } from '../types';

class VelasChain extends ChainProps {
  id = 106;
  symbol = 'VLX';
  signature = `3044022054692bb37807d470ac66b20ba7c03b8df39437cf1bfdd126780855e9a94161c802201c975e45b739efd1dc3a7818fb0bdf42a4b78f739fd94e7ff2f8bb9c525d7475`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
}

export default new VelasChain();
