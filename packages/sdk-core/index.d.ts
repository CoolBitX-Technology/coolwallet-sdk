declare module 'sdk-core' {
  
  export function generateKeyPair(): { publicKey: string, privateKey: string }

  export class CWSDevice {
    constructor(transport: Transport, appPublicKey: string, appPrivateKey: string, appId?: string )

    setAppId(appId: string):void
    async getSEVersion(): Promise<number>
    async resetCard(): Promise<void>
    /**
     * Register current device, get appId from card. 
     */
    async registerDevice(password: string, deviceName: string ): Promise<string>
    async getPairingPassword(): Promise<string>
  }

  export class CWSWallet {
    constructor(transport: Transport, appPublicKey: string, appPrivateKey: string, appId: string )
    async createWallet(strength: number): Promise<boolean>
    async sendCheckSum(sumOfSeed: number): Promise<boolean>
    async setSeed(seedHex: string): Promise<string>
  }

  export class EDDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    /**
     * For EDDSA based coins
     */
    async getPublicKey(addressIndex: number): Promise<string>
  }

  export class ECDSACoin {
    constructor(transport: Transport, appPrivateKey: string, appId: string, coinType: string)
    /**
     * For ECDSA based coins
     */
    async getPublicKey(addressIndex: number): Promise<{ publicKey: string; parentPublicKey: string; parentChainCode: string }>
  }
}
