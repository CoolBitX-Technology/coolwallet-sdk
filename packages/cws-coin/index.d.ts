//import Transport from '@coolwallets/transport'

declare module '@coolwallets/coin' {
  type Transport = import('@coolwallets/transport').default;
  export class ECDSACoin {
    public transport: Transport;

    public appId: string;

    public appPrivateKey: string;

    public coinType: string;

    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string);

    getPublicKey(addressIndex: number): Promise<string>;

    getBIP32NodeInfo(): Promise<{ parentPublicKey: string; parentChainCode: string }>;
  }

  export class EDDSACoin {
    public transport: Transport;

    public appId: string;

    public appPrivateKey: string;

    public coinType: string;

    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string);

    getPublicKey(addressIndex: number, protocol: string): Promise<string>;
  }
}
