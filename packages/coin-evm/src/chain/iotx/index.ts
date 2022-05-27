import { TOKENS } from './token';
import { ChainProps } from '../types';

class IotxChain extends ChainProps {
  id = 4689;
  symbol = 'IOTX';
  signature = `FA`.padEnd(144, '0');
  tokens = TOKENS;
}

export default new IotxChain();

