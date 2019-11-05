declare module '@coolwallets/wallet' {
  
    export function generateKeyPair(): { publicKey: string, privateKey: string }
  
    export class Wallet {
      constructor(transport: Transport, appPrivateKey: string, appId?: string )
  
      setAppId(appId: string):void
      getSEVersion(): Promise<number>
      resetCard(): Promise<void>
      /**
       * Register current device, get appId from card. 
       */
      register(appPublicKey: string, password: string, deviceName: string ): Promise<string>
      getPairingPassword(): Promise<string>
    
      createWallet(strength: number): Promise<boolean>
      sendCheckSum(sumOfSeed: number): Promise<boolean>
      setSeed(seedHex: string): Promise<string>
    }
  
    
  }
  