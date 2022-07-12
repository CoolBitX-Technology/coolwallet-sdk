import { TOKENS } from './tokens';
import { COINS } from './coins';
import { SCRIPTS } from './scripts';

import { ChainProps, CoinProps } from '../base';

// Kava Chain
class Kava extends ChainProps {
  constructor() {
    super(
      /*id=*/ 'kava_2222-10',
      /*symbol=*/ 'KAVA',
      /*coinType=*/ '800001CB',
      /*prefix=*/ 'kava',
      /*signature=*/ `3046022100F341F17EE7DE976FFCBC9B354EF0CA27CB2E1E5CE016AD9AE8EDFB802C6AAAC0022100B22A2CA5795CE8576C8BEEBED96FBD46596C3DBD2D83428001AAF4DF9D52CC3E`,
      /*scripts=*/ SCRIPTS,
      /*coins=*/ COINS,
      /*tokens=*/ TOKENS
    );
  }

  override getNativeCoin(): CoinProps {
    return COINS.ukava;
  }
}

export default new Kava();
