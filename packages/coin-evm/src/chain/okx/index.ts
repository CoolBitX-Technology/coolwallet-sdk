import { TOKENS } from './token';
import { ChainProps } from '../types';

class OkxChain extends ChainProps {
  id = 66;
  symbol = 'OKT';
  signature =
    `304502206CA9FDD8EA293F1AAA838C4EC9C8980302A3822C3AF4CD369526B8363CD810F7022100D7825B42B5BD4AAC40B1E7A2167A0DBB47317421363E2F480268F9303B93C828`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new OkxChain();
