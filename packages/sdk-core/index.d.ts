declare module 'sdk-core' {
    export class EDDSACoin {
      constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
      /**
       * For EDDSA based coins
       */
      async getPublicKey(addressIndex: number) : Promise<string>
    }

    export class ECDSACoin {
      constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
      /**
       * For ECDSA based coins
       */
      async getPublicKey(addressIndex: number) : Promise<{ publicKey: string, parentPublicKey:string, parentChainCode:string }>
  }
}