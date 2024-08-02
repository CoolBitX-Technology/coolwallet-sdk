import { coin as COIN, Transport } from '@coolwallet/core';
import * as AddressUtils from './utils/addressUtils';
import { COIN_TYPE } from './config/param';
import { SignTransferTxType, SignTransferTokenTxType } from './config/types';
import signTransferTransaction from './signTransferTransaction';
import signTransferTokenTransaction from './signTransferTokenTransaction';
export { TOKENS } from './config/tokenInfos';

export default class TON extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(COIN_TYPE);
  }

  async getAddress(
    transport: Transport,
    appPrivateKey: string,
    appId: string,
    addressIndex: number,
    isBounceable: boolean = false
  ): Promise<string> {
    const publicKey = await AddressUtils.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    const address = await AddressUtils.getAddressByPublicKey(publicKey, isBounceable);
    return address;
  }

  async signTransaction(data: SignTransferTxType): Promise<string> {
    return signTransferTransaction(data);
  }

  async signTransferTokenTransaction(data: SignTransferTokenTxType): Promise<string> {
    return signTransferTokenTransaction(data);
  }
}
