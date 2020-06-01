declare module '@coolwallets/wallet' {
  
    export function generateKeyPair(): { publicKey: string, privateKey: string }
  
    export default class Wallet {
      constructor(transport: Transport, appPrivateKey: string, appId?: string )
  
      setAppId(appId: string):void
      getSEVersion(): Promise<number>
      checkRegistered(): Promise<boolean>
      getCardInfo(): Promise<{ paired:boolean, locked:boolean, walletCreated:boolean, showDetail:boolean, pairRemainTimes:number }>
      resetCard(): Promise<void>
      /**
       * Register current device, get appId from card. 
       */
      register(appPublicKey: string, password: string, deviceName: string ): Promise<string>
      getPairingPassword(): Promise<string>
      getPairedApps(): Promise<Array<{appId:string, appName:string}>>
    
      createWallet(strength: number): Promise<boolean>
      sendCheckSum(sumOfSeed: number): Promise<boolean>
      setSeed(seedHex: string): Promise<string>
      initSecureRecovery(strength: number): object
      setSecureRecoveryIdx(index: number): object
      cancelSecureRecovery(type: number): object
      getSecureRecoveryStatus(): object
    }
  }
  