import { TOKENS } from './token';
import { ChainProps } from '../types';

class ThunderCore extends ChainProps {
  id = 108;
  symbol = 'TT';
  signature =
    `304402204BCDECA0E3E329C553E3DDF288B35F19888F674EE17822BC7E562F06DD6C02D8022011FCCD4689C709339E02DCF24E560AF446D1B1EB23227D1C4FA6B58BE65B93B4`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export const THUNDERCORE = new ThunderCore();
