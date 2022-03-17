import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { isSmartContract } from '../utils/arguments';
import { TRANSACTION_TYPE } from './constants';
import type { EIP1559Transaction, LegacyTransaction } from './types';

function getTransactionType(client: LegacyTransaction | EIP1559Transaction): TRANSACTION_TYPE {
  const {
    transaction: { value, data },
  } = client;

  if (!isEmpty(value) && isEmpty(data)) {
    return TRANSACTION_TYPE.TRANSFER;
  }

  if (isSmartContract(value, data)) {
    const symbol = client.transaction.option?.info.symbol;
    const decimals = client.transaction.option?.info.decimals;
    if (!isNil(symbol) && !isEmpty(symbol) && !isNil(decimals) && !isEmpty(decimals)) {
      return TRANSACTION_TYPE.ERC20_TOKEN;
    }
  }

  return TRANSACTION_TYPE.SMART_CONTRACT;
}

export { getTransactionType };
