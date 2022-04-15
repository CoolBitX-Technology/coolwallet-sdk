import { TOKENS } from './token';
import { ChainProps } from '../types';

class AvaxCChain extends ChainProps {
  id = 43114;
  symbol = 'AVAX';
  signature =
    `3045022021992ABD33BA1812A00B5BFFD16493FF4A169DC70D5119D8C033B5A9140E5911022100D38E85257B6CC8C7C5A8B531020F736788F83155A5CF4F89C6FA9B081FF13616`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new AvaxCChain();
