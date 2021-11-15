import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';
import { getAccountExtKeyFromSE } from './derive';

export {
  ECDSACoin, EDDSACoin, getAccountExtKeyFromSE
};

export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
