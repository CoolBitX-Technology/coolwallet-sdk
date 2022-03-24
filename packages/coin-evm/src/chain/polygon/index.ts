import { TOKENS } from './token';
import { ChainProps } from '../types';

class PolygonChain extends ChainProps {
  id = 137;
  symbol = 'MATIC';
  signature =
    `3045022100CE98CB3266C0C57F3B9134B565FB9FD7B7F071FD3AE1318EE1C82EA871BD15EE022016949BE229CBD1AFBAE86F710151522D659A6301D7926E8CCF11399E5E0726FE`.padStart(
      144,
      '0'
    );
  tokens = TOKENS;
}

export default new PolygonChain();
