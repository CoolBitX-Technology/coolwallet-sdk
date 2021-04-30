import ECDSACoin from './ECDSA';
import EDDSACoin from './EDDSA';

export { ECDSACoin, EDDSACoin };
export interface Coin{
  getAddress: Function;
  signTransaction: Function;
}
