import { TOKENS } from './token';
import { ChainProps } from '../types';

class FlareChain extends ChainProps {
  id = 14;
  symbol = 'FLR';
  signature =
    `304502202CF108F42E92EB8B74E8B2BD81624E20895FEC1E31BB3FFEF456219CF9475E4E022100CCE945AD2BD864B98FAF83A15BC7580D52F31FCA1594C8C6C6636CCC8F99832B`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new FlareChain();
