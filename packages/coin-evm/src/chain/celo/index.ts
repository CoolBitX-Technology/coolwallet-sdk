import { TOKENS } from './token';
import { ChainProps } from '../types';

class CeloChain extends ChainProps {
  id = 42220;
  symbol = 'CELO';
  signature =
    `30460221008CB3981C9663D04CE5377781224F3D89098BCBC998E4F2BF24B3A7B6D729AAC4022100C6BAE8CC5956FA298B05F50A05E28DD6D18CC8990483FBCECB3E807339AC4D80`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export const CELO = new CeloChain();
