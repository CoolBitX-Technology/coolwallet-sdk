import { TOKENS, TEST_TOKENS } from './token';
import { ChainProps } from '../types';

class ThunderCore extends ChainProps {
  id = 108;
  symbol = 'TT';
  signature =
    `3045022100B342B65121F2CB9623BD947EEC1373AB73478D115242BB262F90DC5573C98B2402203D5AC87C64974078D503B11335E6E45CD75A85A9E94E92773FFE118D1C8A2893`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

class ThunderCoreTest extends ChainProps {
  id = 18;
  symbol = 'TST';
  signature = `FA`.padEnd(144, '0');
  tokens = TEST_TOKENS;
}

export const THUNDERCORE = new ThunderCore();
export const THUNDERCORE_TEST = new ThunderCoreTest();
