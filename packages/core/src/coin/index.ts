import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';
import { getPublicKeyByPath } from './derive';
import { signECDSA } from './sign';
import { signData } from './signData';
import { SignCurve } from './config/types';
export {
  ECDSACoin, EDDSACoin, getPublicKeyByPath, signECDSA, signData, SignCurve
};
export type {
  SignDataParams,
  SignDataResult,
  EcdsaSignature,
  EddsaSignature,
  SchnorrSignature,
} from './config/types';

export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
