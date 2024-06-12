import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';
import { getPublicKeyByPath } from './derive';

export {
  ECDSACoin, EDDSACoin, getPublicKeyByPath
};

export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
