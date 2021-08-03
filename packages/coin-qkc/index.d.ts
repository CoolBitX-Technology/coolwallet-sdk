export default class cwsETH {
  constructor();
  /**
   * Get Ethereum address by index
   */
	getAddress(
		transport: Transport,
		appPrivateKey: string,
		appId: string,
		addressIndex: string
	): Promise<string>;

  /**
   * Sign Ethereum Transaction.
   */
  signTransaction(
		transport: Transport,
		appPrivateKey: string,
		appId: string,
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
		transport: Transport,
		appPrivateKey: string,
		appId: string,
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
		transport: Transport,
		appPrivateKey: string,
		appId: string,
    typedData: Object,
    addressIndex: number,
    publicKey?: string,
    confirmCB?: Function,
    authorizedCB?: Function
  ): Promise<string>;
}
