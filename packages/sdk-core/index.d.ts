declare module '@coolwallets/sdk-core' {
  
  export function generateKeyPair(): { publicKey: string, privateKey: string }

  export class CWSDevice {
    constructor(transport: Transport, appPrivateKey: string, appId?: string )

    setAppId(appId: string):void
    getSEVersion(): Promise<number>
    resetCard(): Promise<void>
    /**
     * Register current device, get appId from card. 
     */
    register(appPublicKey: string, password: string, deviceName: string ): Promise<string>
    getPairingPassword(): Promise<string>
  }

  export class CWSWallet {
    constructor(transport: Transport, appPrivateKey: string, appId: string )
    createWallet(strength: number): Promise<boolean>
    sendCheckSum(sumOfSeed: number): Promise<boolean>
    setSeed(seedHex: string): Promise<string>
  }

  export class EDDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    /**
     * For EDDSA based coins
     */
    getPublicKey(addressIndex: number): Promise<string>
  }

  export class ECDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    /**
     * For ECDSA based coins
     */
    getPublicKey(addressIndex: number): Promise<{ publicKey: string; parentPublicKey: string; parentChainCode: string }>
  }
}
