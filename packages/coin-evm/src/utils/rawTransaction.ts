import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import createKeccakHash from 'keccak';
import { formatHex, ToHex } from './string';
import {
  EIP1559Transaction,
  EIP712MessageTransaction,
  EIP712TypedDataTransaction,
  LegacyTransaction,
} from '../transaction/types';

/**
 * Get raw payload
 *
 * @param transaction LegacyTransaction
 * @param transaction.nonce transaction nonce
 * @param transaction.gasPrice transaction gasPrice
 * @param transaction.gasLimit transaction gasLimit
 * @param transaction.to transaction to
 * @param transaction.value transaction value
 * @param transaction.data transaction data
 * @return {Array<Buffer>}
 */
function getLegacyRawHex(transaction: LegacyTransaction['transaction'], chainId: number): Buffer[] {
  const rawData = [];
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasPrice);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to);
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  const raw = rawData.map((d) => {
    const hex = formatHex(d);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });
  const id = Buffer.allocUnsafe(6);
  id.writeIntBE(chainId, 0, 6);
  raw[6] = Buffer.from(id.filter((v) => v !== 0));
  raw[7] = Buffer.allocUnsafe(0);
  raw[8] = Buffer.allocUnsafe(0);
  return raw;
}

function getEIP1559RawHex(transaction: EIP1559Transaction['transaction'], chainId: number): (Buffer | Buffer[])[] {
  const rawData = [];
  rawData.push(formatHex(chainId.toString(16))); // chainId
  rawData.push(transaction.nonce);
  rawData.push(transaction.gasTipCap);
  rawData.push(transaction.gasFeeCap);
  rawData.push(transaction.gasLimit);
  rawData.push(transaction.to);
  rawData.push(transaction.value);
  rawData.push(transaction.data);
  const raw: (Buffer | Buffer[])[] = rawData.map((d) => {
    const hex = formatHex(d);
    if (hex === '00' || hex === '') {
      return Buffer.allocUnsafe(0);
    }
    return Buffer.from(hex, 'hex');
  });

  const emptyAccessList = [] as Buffer[];
  raw.push(emptyAccessList);
  return raw;
}

function getEIP712TypedDataRawHex(typedData: EIP712TypedDataTransaction['typedData']): Buffer {
  const sanitizedData = TypedDataUtils.sanitizeData(typedData);

  const encodedData = TypedDataUtils.encodeData(
    sanitizedData.primaryType as string,
    sanitizedData.message,
    sanitizedData.types,
    SignTypedDataVersion.V4
  );

  const domainSeparate = TypedDataUtils.hashStruct(
    'EIP712Domain',
    sanitizedData.domain,
    sanitizedData.types,
    SignTypedDataVersion.V4
  );

  const prefix = Buffer.from('1901', 'hex');

  const dataBuf = createKeccakHash('keccak256').update(encodedData).digest();

  return Buffer.concat([prefix, domainSeparate, dataBuf]);
}

function getEIP712MessageRawHex(message: EIP712MessageTransaction['message']): Buffer {
  const messageBuffer = Buffer.from(formatHex(ToHex(message)), 'hex');
  const prefixBuffer = Buffer.from('\x19Ethereum Signed Message:\n' + messageBuffer.length, 'ascii');

  return Buffer.concat([prefixBuffer, messageBuffer]);
}

export { getLegacyRawHex, getEIP1559RawHex, getEIP712TypedDataRawHex, getEIP712MessageRawHex };
