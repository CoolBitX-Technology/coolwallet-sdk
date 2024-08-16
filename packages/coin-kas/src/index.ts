
import { coin as COIN, Transport } from '@coolwallet/core';
import { COIN_TYPE } from './config/param';
import { getAddressByPublicKey } from './utils/address';
import { SignTransferTxType } from './config/type';
import signTransferTransaction from './sign';

export default class KAS extends COIN.ECDSACoin implements COIN.Coin {
  constructor() {
    super(COIN_TYPE);
  }

  async getAddress(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    purpose?: number
  ): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex, purpose);
    return getAddressByPublicKey(publicKey);
  }

  async signTransaction(signTxType: SignTransferTxType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex } = signTxType;
    const changePublicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const changeAddress = getAddressByPublicKey(changePublicKey);
    return signTransferTransaction(signTxType, changeAddress);
  }
}
