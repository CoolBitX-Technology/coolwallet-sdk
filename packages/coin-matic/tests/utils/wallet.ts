import { CURVE, HDWallet } from '@coolwallet/testing-library';
import { signTypedData, TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';

class Wallet extends HDWallet {
  constructor() {
    super(CURVE.SECP256K1);
  }

  async signTypedData(transaction: any, addressIndex = 0): Promise<string> {
    const typedData = TypedDataUtils.sanitizeData(transaction);
    const privKey = this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).privateKey;
    return signTypedData({ privateKey: privKey, data: typedData, version: SignTypedDataVersion.V4 });
  }
}

export default Wallet;
