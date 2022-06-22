import { utils, config } from '@coolwallet/core';
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { formatHex, ToHex } from './string';
import * as Encoder from './encoder';
import { encodeTokenToSE } from './token';
import type {
  EIP1559Transaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
  LegacyTransaction,
} from '../transaction/types';
import { FANTOM } from '../chain';
import type { ChainProps } from '../chain/types';

async function getSELegacyTransaction(client: LegacyTransaction, chain: ChainProps, coinType: string): Promise<string> {
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeLegacyTransactionToSE(client.transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  return '15' + path + encoded + chainInfo + chainSignature;
}

async function getSELegacyERC20Transaction(
  client: LegacyTransaction,
  signature: string,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeLegacyERC20TransactionToSE(client.transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();
  const tokenInfo = encodeTokenToSE(transaction.to, transaction.option);
  const tokenSignature = signature.slice(58).padStart(144, '0');

  return '15' + path + encoded + chainInfo + chainSignature + tokenInfo + tokenSignature;
}

async function getSELegacySmartContractTransaction(
  client: LegacyTransaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeLegacyTransactionToSE(transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  // Ensure lowercase to be detected by card
  transaction.to = transaction.to.toLowerCase();

  return '15' + path + encoded + chainInfo + chainSignature + formatHex(transaction.data);
}

async function getSELegacySmartContractSegmentTransaction(
  client: LegacyTransaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeLegacySmartContractSegmentTransactionToSE(transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  return '15' + path + encoded + chainInfo + chainSignature;
}

async function getSEEIP712MessageTransaction(
  client: EIP712MessageTransaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { message } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();
  const messageHex = formatHex(ToHex(message));
  const messageBytesLength = Buffer.from((messageHex.length / 2).toString()).toString('hex');

  return '15' + path + chainInfo + chainSignature + messageBytesLength + messageHex;
}

async function getSEEIP712TypedDataTransaction(
  client: EIP712TypedDataTransaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { typedData } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();
  const sanitizedData = TypedDataUtils.sanitizeData(typedData);
  const domainSeparator = TypedDataUtils.hashStruct(
    'EIP712Domain',
    sanitizedData.domain,
    sanitizedData.types,
    SignTypedDataVersion.V4
  );
  const encodedData = TypedDataUtils.encodeData(
    sanitizedData.primaryType as string,
    sanitizedData.message,
    sanitizedData.types,
    SignTypedDataVersion.V4
  );

  /**
   * path-length
   * path
   * domainSeparator length 32 bytes
   * chainInfo 30 bytes
   * chainSignature 72 bytes
   * encodedData variant bytes
   */
  return (
    '15' +
    path +
    formatHex(domainSeparator.toString('hex')).padStart(64, '0') +
    chainInfo +
    chainSignature +
    formatHex(encodedData.toString('hex'))
  );
}

async function getSEEIP1559Transaction(
  client: EIP1559Transaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeEIP1559TransactionToSE(client.transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  return '15' + path + encoded + chainInfo + chainSignature;
}

async function getSEEIP1559ERC20Transaction(
  client: EIP1559Transaction,
  signature: string,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeEIP1559ERC20TransactionToSE(transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();
  const tokenInfo = encodeTokenToSE(transaction.to, transaction.option);
  const tokenSignature = signature.slice(58).padStart(144, '0');

  return '15' + path + encoded + chainInfo + chainSignature + tokenInfo + tokenSignature;
}

async function getSEEIP1559SmartContractTransaction(
  client: EIP1559Transaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeEIP1559TransactionToSE(transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  return '15' + path + encoded + chainInfo + chainSignature + formatHex(transaction.data);
}

async function getSEEIP1559SmartContractSegmentTransaction(
  client: EIP1559Transaction,
  chain: ChainProps,
  coinType: string
): Promise<string> {
  const { transaction } = client;
  const path = await utils.getPath(coinType, client.addressIndex, 5, config.PathType.BIP32);
  const encoded = Encoder.encodeEIP1559SmartContractSegmentTransactionToSE(transaction);
  const chainInfo = chain.toHexChainInfo();
  const chainSignature = chain.getSignature();

  return '15' + path + encoded + chainInfo + chainSignature;
}

export {
  getSELegacyTransaction,
  getSELegacyERC20Transaction,
  getSELegacySmartContractTransaction,
  getSELegacySmartContractSegmentTransaction,
  getSEEIP712MessageTransaction,
  getSEEIP712TypedDataTransaction,
  getSEEIP1559Transaction,
  getSEEIP1559ERC20Transaction,
  getSEEIP1559SmartContractTransaction,
  getSEEIP1559SmartContractSegmentTransaction,
};
