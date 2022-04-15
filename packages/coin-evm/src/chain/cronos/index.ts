import { TOKENS } from './token';
import { ChainProps } from '../types';

class CronosChain extends ChainProps {
  id = 25;
  symbol = 'CRO';
  signature =
    `304502204B29D002360946A6CF5BC01476AFAEBDFBA691A4D797B44C74013DE4BBA2379D022100C84AA903A375E2FFE3BECEB9D9B554FFDADE8FC79DDBC7B1D3F868C3D8396428`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new CronosChain();
