import { TOKENS } from './tokens';
import { COINS } from './coins';
import { SCRIPTS } from './scripts';

import { ChainProps, CoinProps } from '../base';

// Thor Chain
class Thor extends ChainProps {
  constructor() {
    super(
      /*id=*/ 'thorchain-mainnet-v1',
      /*symbol=*/ 'THOR',
      /*coinType=*/ '800003a3',
      /*prefix=*/ 'thor',
      /*signature=*/ `3046022100F02D5066064F1DAB91E8F068D79E10AD0F908D82F3C32EC41A9245390DAF190A022100DBF2B5098473CA6BCBFFED1EA452D1268400011E9A4D36278AD9CB44E4AB34BA`,
      /*scripts=*/ SCRIPTS,
      /*coins=*/ COINS,
      /*tokens=*/ TOKENS
    );
  }

  override getNativeCoin(): CoinProps {
    return COINS.rune;
  }
}

export default new Thor();
