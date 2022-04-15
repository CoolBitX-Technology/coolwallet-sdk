import { TOKENS } from './token';
import { ChainProps } from '../types';

class ArbitrumChain extends ChainProps {
  id = 42161;
  symbol = 'ETH';
  signature =
    `304402201EC6A286B8F71B7A955BB63E11E18078EFE38C94133AC0B08819100F6CBEAEAC02203C88622CFF98AB5A27757FF62F5A3EDD669F63B6F21040A46FA67CB20C70313D`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new ArbitrumChain();
