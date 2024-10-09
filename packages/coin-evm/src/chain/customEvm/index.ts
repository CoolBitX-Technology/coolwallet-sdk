import { ChainProps } from '../types';

export default class CustomEvm extends ChainProps {
  id = -1;
  symbol = '';
  signature = '';
  tokens = {};

  constructor(chainId: number) {
    super();
    this.id = chainId;
  }
}
