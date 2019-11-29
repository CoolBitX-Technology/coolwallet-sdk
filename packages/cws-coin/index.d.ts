import Transport from '@coolwallets/transport'

declare module '@coolwallets/coin' {
  export class ECDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    getPublicKey(
      addressIndex: number,
      returnNodeInfo?: boolean
    ): Promise<string | { publicKey: string; parentPublicKey: string; parentChainCode: string }>
  }

  export class EDDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    getPublicKey(addressIndex: number): Promise<string>
  }
}
