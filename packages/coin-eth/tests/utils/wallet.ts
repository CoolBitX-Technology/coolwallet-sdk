import { CURVE, HDWallet } from '@coolwallet/testing-library';
import Common from '@ethereumjs/common';
import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
  Transaction as EthereumTransaction,
  TxData,
} from '@ethereumjs/tx';
import { publicToAddress } from 'ethereumjs-util';
import { signTypedData, personalSign, TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import type { EIP1559Transaction, Transaction } from '../../src/config/types';

class Wallet extends HDWallet {
  constructor() {
    super(CURVE.SECP256K1);
  }

  async signTransaction(transaction: Transaction, chainId: number, addressIndex = 0): Promise<string> {
    const txData: TxData = {
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      value: transaction.value,
      to: transaction.to,
      data: transaction.data,
    };
    const transactionInfo = EthereumTransaction.fromTxData(txData, { common: Common.custom({ chainId }) });
    const privKey = this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).privateKey;
    return `0x${transactionInfo.sign(privKey).serialize().toString('hex')}`;
  }

  async signEIP1559Transaction(transaction: EIP1559Transaction, chainId: number, addressIndex = 0): Promise<string> {
    const txData: FeeMarketEIP1559TxData = {
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit,
      maxFeePerGas: transaction.gasTipCap,
      maxPriorityFeePerGas: transaction.gasFeeCap,
      to: transaction.to,
      value: transaction.value,
      data: transaction.data,
      chainId,
    };
    const transactionInfo = FeeMarketEIP1559Transaction.fromTxData(txData);
    const privKey = this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).privateKey;
    return `0x${transactionInfo.sign(privKey).serialize().toString('hex')}`;
  }

  async signTypedData(transaction: any, addressIndex = 0): Promise<string> {
    const typedData = TypedDataUtils.sanitizeData(transaction);
    const privKey = this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).privateKey;
    return signTypedData({ privateKey: privKey, data: typedData, version: SignTypedDataVersion.V4 });
  }

  async signMessage(message: string, addressIndex = 0): Promise<string> {
    const privKey = this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).privateKey;
    return personalSign({ privateKey: privKey, data: message });
  }

  async getAddress(addressIndex = 0): Promise<string> {
    const publicKey = await this.derivePath(`m/44'/60'/0'/0/${addressIndex}`).getPublicKey();
    if (!publicKey) throw new Error('Cannot derive public key.');
    return `0x${publicToAddress(publicKey, true).toString('hex').toLowerCase()}`;
  }
}

export default Wallet;
