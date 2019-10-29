declare module 'sdk-core' {
    export class CWSWallet {
      constructor()
    }

    export class CWSDevice {

    }

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