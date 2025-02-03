import { TOKENS } from './token';
import { ChainProps } from '../types';

class CoreChain extends ChainProps {
  id = 1116;
  symbol = 'CORE';
  signature =
    `304502205110D665BD7296087088D030598FDA9A6A09F3A5FB41CCB270B1BF43A478A9D5022100D35CE88FA465F36517DB9D072291CDA10600EFCFF05260A64545078BCD6CBD23`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new CoreChain();
