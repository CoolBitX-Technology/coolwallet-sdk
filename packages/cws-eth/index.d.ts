declare class cwsETH {
  constructor(transport: CWSTransport, appPrivateKey: string, appId: string)
  /**
   * Get Ethereum address by index
   */
  async getAddress(addressIndex:string) : Promise<string>

  /**
   * Sign Ethereum Transaction.
   */
  async signTransaction(payload:string, addressIndex:number, publicKey:string) : Promise<string>

  /**
   * Sign Arbitrary Message.
   */
  async signMessage(message:string, addressIndex:number, publicKey:string, isHashRequired?:Boolean) : Promise<string>

  /**
   * Sign EIP712 typed data
   */
  async signTypedData(typedData: Object,  addressIndex:number, publicKey:string) : Promise<string>
}

export default cwsETH
