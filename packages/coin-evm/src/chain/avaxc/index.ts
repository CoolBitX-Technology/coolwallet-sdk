import { TOKENS, TEST_TOKENS } from './token';
import { ChainProps } from '../types';

class AvaxCChain extends ChainProps {
  id = 43114;
  symbol = 'AVAX';
  signature =
    `3044022035eedefff31e2a03f564ea134d2f006f986b103ad4576dc0325c1bc3933d57ad0220798d56d8f4d1f16cc7860b97144674d215a6116bd3983028eea32ac200bba4b7`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

class AvaxCTestChain extends ChainProps {
  id = 43113;
  symbol = 'AVAX';
  signature = `FA`.padEnd(144, '0');
  tokens = TEST_TOKENS;
}

export const AVAXC = new AvaxCChain();
export const AVAXC_TEST = new AvaxCTestChain();
