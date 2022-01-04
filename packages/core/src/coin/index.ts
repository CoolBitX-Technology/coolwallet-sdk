import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';
import { getPublicKey } from './derive';

export {
  ECDSACoin, EDDSACoin, getPublicKey
};

export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
