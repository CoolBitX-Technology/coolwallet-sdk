import { ChainProps } from '../types';
import { TOKENS } from './token';

class BaseChain extends ChainProps {
  id = 8453;
  symbol = 'ETH';
  layer2 = 'BASE';
  signature =
    `304402203BB4157055C624BA8ED3905B8A1D206CA8B6962F80B368A1A8AA442562B94CBD022052C623DFA000EB205C8D19731A2E0516319D7FF1369AD204BEAADF21080A08B4`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new BaseChain();
