import { TransactionType } from '../config/types';
import base58 from 'bs58';
import { TRANSACTION_TYPE } from '../config/params';

export const isBase58Format = (value: string): boolean => {
  const match = value.match(/([G-Z])|([g-z])/g);
  return !!(match && match.length > 0);
};

export const addressToHex = (address: string | Buffer | undefined): string => {
  if (!address) return '';
  if (typeof address === 'string') {
    if (isBase58Format(address)) return base58.decode(address).toString('hex');
    return address;
  }
  return address.toString('hex');
};

export const numberToStringHex = (value: number | number[], pad: number) =>
  Buffer.from(typeof value === 'number' ? [value] : value)
    .toString('hex')
    .padStart(pad, '0');

const isFieldsValid = (fields: Array<any>) => {
  console.log('🚀 ~ file: stringUtil.ts ~ line 25 ~ fields', fields);
  return fields.every((e) => e !== undefined);
};

export const getTxType = (transaction: TransactionType): string => {
  if (transaction.options) {
    const { programId, data, owner, decimals, value } = transaction.options;
    if (isFieldsValid([programId, data, owner])) return TRANSACTION_TYPE.SMART_CONTRACT;
    else if (isFieldsValid([owner, decimals, value])) return TRANSACTION_TYPE.SPL_TOKEN;
  }
  return TRANSACTION_TYPE.TRANSFER;
};

export const encodeLength = (bytes: number[], len: number): void => {
  let rem_len = len;
  for (;;) {
    let elem = rem_len & 0x7f;
    rem_len >>= 7;
    if (rem_len == 0) {
      bytes.push(elem);
      break;
    } else {
      elem |= 0x80;
      bytes.push(elem);
    }
  }
};
