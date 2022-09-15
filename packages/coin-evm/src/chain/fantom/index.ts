import { TOKENS } from './token';
import { ChainProps } from '../types';

class FantomChain extends ChainProps {
  id = 250;
  symbol = 'FTM';
  signature = `3045022100ac4be00c7e01d6a78cf3c46df56c77f891d902ad7f9c2a6373114a22432120e20220141a04d41b0c3045f17d2c59dc8f5609ef160d137218613fec925b3dab560132`.padStart(
    144,
    '0'
  );
  tokens = TOKENS;
  stakingInfo = {
    contractAddress: '0xfc00face00000000000000000000000000000000',
    delegate: '0x9fa6dd35',
    withdraw: '0x0962ef79',
    undelegate: '0x4f864df4',
  };
}

export default new FantomChain();
