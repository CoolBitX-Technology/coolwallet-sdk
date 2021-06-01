export default class cwsETH {
  constructor(transport: Transport, appPrivateKey: string, appId: string);
  /**
   * Get Ethereum address by index
   */
  getAddress(addressIndex: string): Promise<string>;

  /**
   * Sign Ethereum Transaction.
   */
  signTransaction(
    transaction: {
      nonce: string;
      gasPrice: string;
      gasLimit: string;
      to: string;
      value: string;
      data: string;
      chainId: number;
    },
    addressIndex: number,
    publicKey?: string,
    confirmCB?: Function,
    authorizedCB?: Function
  ): Promise<string>;

  /**
   * Sign Arbitrary Message.
   */
  signMessage(
    message: string,
    addressIndex: number,
    publicKey?: string,
    isHashRequired?: Boolean,
    confirmCB?: Function,
    authorizedCB?: Function
  ): Promise<string>;

  /**
   * Sign EIP712 typed data
   */
  signTypedData(
    typedData: Object,
    addressIndex: number,
    publicKey?: string,
    confirmCB?: Function,
    authorizedCB?: Function
  ): Promise<string>;
}
