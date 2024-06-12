import { TOKENS } from './token';
import { ChainProps } from '../types';

class OptimismChain extends ChainProps {
  id = 10;
  symbol = 'ETH';
  layer2 = 'OP';
  signature =
    `304402206C18C825DC1C7F71224D3F0AF17176383069BDF40F8D0531588DE93DDB290AE302203AF27CEFE67D580A88A55F9FB9E285A652A7D8901C58DBBFEB8285C9CB41589C`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new OptimismChain();
