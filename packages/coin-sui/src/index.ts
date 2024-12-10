import { coin as COIN, Transport, utils } from '@coolwallet/core';
import { COIN_TYPE } from './config/param';
import { PathType } from '@coolwallet/core/lib/config';
import { Ed25519PublicKey } from '@mysten/sui/dist/cjs/keypairs/ed25519/publickey';
import { CoinTransactionArgs, SmartTransactionArgs, TokenTransactionArgs } from './config/types';
import { signSmartTransaction } from './sign';
export { TokenInfo as TOKENINFO } from './config/types';
export { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export default class Sui extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/784'/0'/0'/${addressIndex}'` });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    const base64 = Buffer.from(publicKey, 'hex').toString('base64');
    return new Ed25519PublicKey(base64).toSuiAddress();
  }

  async signTransaction(transactionArgs: CoinTransactionArgs): Promise<string> {
    throw new Error(`To do implement`);
  }

  async signTransferTokenTransaction(transactionArgs: TokenTransactionArgs) {
    throw new Error(`To do implement`);
  }

  async signSmartContractTransaction(transactionArgs: SmartTransactionArgs) {
    return signSmartTransaction(transactionArgs);
  }
}
