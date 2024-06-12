import { CURVE, HDWallet } from '@coolwallet/testing-library';
import Common from '@ethereumjs/common';
import { FeeMarketEIP1559Transaction, FeeMarketEIP1559TxData, Transaction, TxData } from '@ethereumjs/tx';
import { publicToAddress } from 'ethereumjs-util';
import { signTypedData, personalSign, TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import type {
  EIP1559Transaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
  LegacyTransaction,
} from '../../src/transaction/types';

class Wallet extends HDWallet {
  private _coinType = '8000003c';

  public get coinType(): string {
    return this._coinType;
  }

  public set coinType(hex: string) {
    const value = parseInt(hex, 16);
    if (value > 0x80000000) {
      this._coinType = (value - 0x80000000).toString();
      console.log(this._coinType);
    } else {
      this._coinType = value.toString();
    }
  }

  constructor() {
    super(CURVE.SECP256K1);
  }

  async signTransaction(
    transaction: LegacyTransaction['transaction'],
    chainId: number,
    addressIndex = 0
  ): Promise<string> {
    const txData: TxData = {
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      value: transaction.value,
      to: transaction.to,
      data: transaction.data,
    };
    const transactionInfo = Transaction.fromTxData(txData, { common: Common.custom({ chainId }) });
    const privKey = this.derivePath(`m/44'/${this.coinType}'/0'/0/${addressIndex}`).privateKey;
    return `0x${transactionInfo.sign(privKey).serialize().toString('hex')}`;
  }

  async signEIP1559Transaction(
    transaction: EIP1559Transaction['transaction'],
    chainId: number,
    addressIndex = 0
  ): Promise<string> {
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
    const privKey = this.derivePath(`m/44'/${this.coinType}'/0'/0/${addressIndex}`).privateKey;
    return `0x${transactionInfo.sign(privKey).serialize().toString('hex')}`;
  }

  async signTypedData(transaction: EIP712TypedDataTransaction['typedData'], addressIndex = 0): Promise<string> {
    const typedData = TypedDataUtils.sanitizeData(transaction);
    const privKey = this.derivePath(`m/44'/${this.coinType}'/0'/0/${addressIndex}`).privateKey;
    return signTypedData({ privateKey: privKey, data: typedData, version: SignTypedDataVersion.V4 });
  }

  async signMessage(message: EIP712MessageTransaction['message'], addressIndex = 0): Promise<string> {
    const privKey = this.derivePath(`m/44'/${this.coinType}'/0'/0/${addressIndex}`).privateKey;
    return personalSign({ privateKey: privKey, data: message });
  }

  async getAddress(addressIndex = 0): Promise<string> {
    const publicKey = await this.derivePath(`m/44'/${this.coinType}'/0'/0/${addressIndex}`).getPublicKey();
    return `0x${publicToAddress(publicKey, true).toString('hex').toLowerCase()}`;
  }

  async getAccountAddress(): Promise<{ publicKey: string; chainCode: string }> {
    const publicKey = await this.derivePath(`m/44'/${this.coinType}'/0'`).getPublicKey();
    const chainCode = await this.derivePath(`m/44'/${this.coinType}'/0'`).chainCode;
    return {
      publicKey: publicKey?.toString('hex').toLowerCase() ?? '',
      chainCode: chainCode.toString('hex').toLowerCase(),
    };
  }
}

export default Wallet;
