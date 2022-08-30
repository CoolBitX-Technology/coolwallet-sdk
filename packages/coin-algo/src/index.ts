import { coin as COIN, error as ERROR, Transport, utils, config } from '@coolwallet/core';
import * as params from './config/params';
import * as types from './config/types';
import { signTransaction } from './sign';
import * as address from './utils/address';
import { getScriptAndArgument } from './utils/scriptUtils';

class ALGO extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex = 0): Promise<string> {
    const path = utils.getFullPath({
      pathType: config.PathType.SLIP0010,
      pathString: `44'/283'/0'/0'/${addressIndex}'`,
    });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'Public key is undefined');
    }
    return address.encodeAddress(publicKey);
  }

  async signTransaction(signTxData: types.SignTxType): Promise<string> {
    const { script, argument } = getScriptAndArgument(signTxData.transaction);
    return signTransaction(signTxData, script, argument);
  }
}

export default ALGO;
