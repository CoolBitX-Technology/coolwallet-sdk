import { TOKENS } from './tokens';
import { COINS } from './coins';
import { SCRIPTS } from './scripts';

import { ChainProps, CoinProps } from '../base';

// Atom Chain
class Atom extends ChainProps {
  constructor() {
    super(
      /*id=*/ 'cosmoshub-4',
      /*symbol=*/ 'ATOM',
      /*coinType=*/ '80000076',
      /*prefix=*/ 'cosmos',
      /*signature=*/ `003045022100DE9CEA6458A3CBC021DBE6B9E35B796C40B1BCD574F262EE2B19A34E481AF45D02203E56C1619038268648F7CF80A349D9A27A484C02A33121B626C985775B4C92DE`,
      /*scripts=*/ SCRIPTS,
      /*coins=*/ COINS,
      /*tokens=*/ TOKENS
    );
  }

  override getNativeCoin(): CoinProps {
    return COINS.uatom;
  }
}

export default new Atom();
