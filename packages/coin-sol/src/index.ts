import { coin as COIN, error as ERROR, Transport } from '@coolwallet/core';
import * as txUtil from './utils/transactionUtil';
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';

export { types };

export default class XLM extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, true);

    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return this.getAddressByAccountKey(publicKey);
  }

  async getAddressByAccountKey(publicKey: string): Promise<string> {
    return txUtil.pubKeyToAddress(publicKey);
  }

  async signTransaction(signTxData: types.signTxType): Promise<Buffer> {
    const { message } = signTxData;
    const programIdIndex = message.instructions[message.instructions.length - 1].programIdIndex;
    let transactionType;

    if (message.accountKeys[programIdIndex].equals(params.TRANSFER_PROGRAM_ID))
      transactionType = params.TRANSACTION_TYPE.TRANSFER;
    else if (message.accountKeys[programIdIndex].equals(params.TOKEN_PROGRAM_ID))
      transactionType = params.TRANSACTION_TYPE.SPL_TOKEN;
    else transactionType = params.TRANSACTION_TYPE.SMART_CONTRACT;

    if (signTxData.testscript) transactionType.script = signTxData.testscript;
    console.log('🚀 ~ file: index.ts ~ line 37 ~ XLM ~ signTransaction ~ transactionType', transactionType);

    const signature = signTransaction(signTxData, transactionType);
    return signature;
  }
}
