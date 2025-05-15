import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';
import { getPublicKeyByPath } from './derive';
import { signECDSA } from './sign';
export {
  ECDSACoin, EDDSACoin, getPublicKeyByPath, signECDSA
};

export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
