/* eslint-disable max-len */
class ECDSA {
  constructor(transport, appPrivateKey, appId, coinType) {
    this.transport = transport;
    this.appPrivateKey = appPrivateKey;
    this.appId = appId;
    this.coinType = coinType;
    this.getPublicKey = this.getPublicKey.bind(this);
  }

  async getPublicKey() {
    return '033a057e1f19ea73423bd75f4d391dd28145636081bf0c2674f89fd6d04738f293';
  }
}

const core = {
  utils: {
    getPath: jest.fn(() => '328000002C8000003C800000000000000000000000')
  },
  coin:{
    ECDSACoin: ECDSA,
    Coin:{
      getAddress: jest.fn(() => Function),
      signTransaction: jest.fn(() => Function)
    }
  },
  tx:{
    flow: {
      getSingleSignatureFromCoolWallet: jest.fn(() => {
        return{
          r: '7cce23b352f3c1f11ef4833e76b3b0cb14ca17bb0097d197b307690a551d19ee',
          s: '156703269448e84d2a82e07531375896fd6fc6e0478cdda876315611d4cad697'
        }
      }),
    }
  }
}
module.exports = core;
