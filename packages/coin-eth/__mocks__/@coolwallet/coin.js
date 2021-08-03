/* eslint-disable class-methods-use-this */
export class ECDSACoin {
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

  async getBIP32NodeInfo() {
    return {
      parentPublicKey: '0389a94efa3e5384a4cc3fc01a368ce3e10bb0883f6f61a32c58fe6e6b089f6dc2',
      parentChainCode: 'cfa8134ff19fd1c746233f7090439a11cc76e85fb2ca647534ad1f945aa642a9'
    };
  }
}
