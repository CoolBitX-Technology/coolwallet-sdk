import { coin as COIN, Transport, error } from '@coolwallet/core';
import Ajv from 'ajv';
import { SCRIPTS } from './config/scripts';
import { COIN_TYPE } from './config/constants';
import { EIP712Schema } from './config/schema';
import { TRANSACTION_TYPE } from './transaction/constants';
import { getTransactionType } from './transaction';
import * as sign from './sign';
import { pubKeyToAddress } from './utils/address';
import * as SEArguments from './utils/arguments';
import type { ChainProps } from './chain/types';
import type * as Transaction from './transaction/types';

class Evm extends COIN.ECDSACoin {
  chain: ChainProps;

  constructor(chain: ChainProps) {
    super(COIN_TYPE);
    this.chain = chain;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  async getAddressByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<string> {
    const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
    return pubKeyToAddress(publicKey);
  }

  async signTransaction(client: Transaction.LegacyTransaction): Promise<string> {
    const type = getTransactionType(client, this.chain);
    switch (type) {
      case TRANSACTION_TYPE.TRANSFER:
        return this.signTransferTransaction(client);
      case TRANSACTION_TYPE.ERC20_TOKEN:
        return this.signERC20Transaction(client);
      case TRANSACTION_TYPE.SMART_CONTRACT:
        return this.signSmartContractTransaction(client);
    }
  }

  async signTransferTransaction(client: Transaction.LegacyTransaction): Promise<string> {
    const script = SCRIPTS.signTransaction.scriptWithSignature;
    const argument = await SEArguments.getSELegacyTransaction(client, this.chain, this.coinType);
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    return sign.signTransaction(client, script, argument, this.chain.id, publicKey);
  }

  async signERC20Transaction(client: Transaction.LegacyTransaction, signature = ''): Promise<string> {
    const {
      transaction: { option },
    } = client;
    const tokenSignature = option?.info.signature ?? signature;
    const script = SCRIPTS.signERC20Transaction.scriptWithSignature;
    const argument = await SEArguments.getSELegacyERC20Transaction(client, tokenSignature, this.chain, this.coinType);
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    return sign.signTransaction(client, script, argument, this.chain.id, publicKey);
  }

  async signSmartContractTransaction(client: Transaction.LegacyTransaction): Promise<string> {
    const { transaction } = client;
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );
    // if data bytes is larger than 4000 sign it segmentally.
    if (transaction.data.length > 8000) {
      const script = SCRIPTS.signSmartContractSegmentTransaction.scriptWithSignature;
      const argument = await SEArguments.getSELegacySmartContractSegmentTransaction(client, this.chain, this.coinType);
      return sign.signLegacyTransactionSegmentally(
        client,
        script,
        argument,
        transaction.data,
        this.chain.id,
        publicKey
      );
    }

    const script = SCRIPTS.signSmartContractTransaction.scriptWithSignature;
    const argument = await SEArguments.getSELegacySmartContractTransaction(client, this.chain, this.coinType);
    
    return sign.signTransaction(client, script, argument, this.chain.id, publicKey);
  }

  async signMessage(client: Transaction.EIP712MessageTransaction): Promise<string> {
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    const script = SCRIPTS.signMessage.scriptWithSignature;
    const argument = await SEArguments.getSEEIP712MessageTransaction(client, this.chain, this.coinType);
    return sign.signTransaction(client, script, argument, this.chain.id, publicKey);
  }

  async signTypedData(client: Transaction.EIP712TypedDataTransaction): Promise<string> {
    const ajv = new Ajv();
    if (!ajv.validate(EIP712Schema, client.typedData)) {
      throw new error.SDKError(this.signTypedData.name, ajv.errorsText());
    }
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    const script = SCRIPTS.signTypedData.scriptWithSignature;
    const argument = await SEArguments.getSEEIP712TypedDataTransaction(client, this.chain, this.coinType);
    return sign.signTransaction(client, script, argument, this.chain.id, publicKey);
  }

  async signEIP1559Transaction(client: Transaction.EIP1559Transaction): Promise<string> {
    const type = getTransactionType(client, this.chain);
    switch (type) {
      case TRANSACTION_TYPE.TRANSFER:
        return this.signEIP1559TransferTransaction(client);
      case TRANSACTION_TYPE.ERC20_TOKEN:
        return this.signEIP1559ERC20Transaction(client);
      case TRANSACTION_TYPE.SMART_CONTRACT:
        return this.signEIP1559SmartContractTransaction(client);
    }
  }

  async signEIP1559TransferTransaction(client: Transaction.EIP1559Transaction): Promise<string> {
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    const script = SCRIPTS.signEIP1559Transaction.scriptWithSignature;
    const argument = await SEArguments.getSEEIP1559Transaction(client, this.chain, this.coinType);
    return sign.signEIP1559Transaction(client, script, argument, this.chain.id, publicKey);
  }

  async signEIP1559ERC20Transaction(client: Transaction.EIP1559Transaction, signature = ''): Promise<string> {
    const {
      transaction: { option },
    } = client;
    const tokenSignature = option?.info.signature ?? signature;
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );

    const script = SCRIPTS.signEIP1559ERC20Transaction.scriptWithSignature;
    const argument = await SEArguments.getSEEIP1559ERC20Transaction(client, tokenSignature, this.chain, this.coinType);
    return sign.signEIP1559Transaction(client, script, argument, this.chain.id, publicKey);
  }

  async signEIP1559SmartContractTransaction(client: Transaction.EIP1559Transaction): Promise<string> {
    const { transaction } = client;
    const publicKey = await this.getPublicKey(
      client.transport,
      client.appPrivateKey,
      client.appId,
      client.addressIndex
    );
    // if data bytes is larger than 4000 sign it segmentally.
    if (transaction.data.length > 8000) {
      const script = SCRIPTS.signEIP1559SmartContractSegmentTransaction.scriptWithSignature;
      const argument = await SEArguments.getSEEIP1559SmartContractSegmentTransaction(client, this.chain, this.coinType);
      return sign.signEIP1559TransactionSegmentally(
        client,
        script,
        argument,
        transaction.data,
        this.chain.id,
        publicKey
      );
    }

    const script = SCRIPTS.signEIP1559SmartContractTransaction.scriptWithSignature;
    const argument = await SEArguments.getSEEIP1559SmartContractTransaction(client, this.chain, this.coinType);
    return sign.signEIP1559Transaction(client, script, argument, this.chain.id, publicKey);
  }
}

export * as CHAIN from './chain';
export default Evm;
