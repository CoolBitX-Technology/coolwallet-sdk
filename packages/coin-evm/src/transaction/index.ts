import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { ChainProps } from '../chain/types';
import { isSmartContract } from '../utils/arguments';
import { getOfficialTokenByContractAddress } from '../utils/token';
import { TRANSACTION_TYPE } from './constants';
import type { EIP1559Transaction, LegacyTransaction } from './types';

function getTransactionType(client: LegacyTransaction | EIP1559Transaction, chain: ChainProps): TRANSACTION_TYPE {
  const {
    transaction: { value, data, to },
  } = client;

  if (!isEmpty(value) && isEmpty(data)) {
    return TRANSACTION_TYPE.TRANSFER;
  }

  if (isSmartContract(value, data)) {
    const official = getOfficialTokenByContractAddress(to, chain);
    if (!isNil(official)) {
      client.transaction.option = {
        info: {
          symbol: official.symbol,
          decimals: official.unit,
          signature: official.signature,
        },
      };
    }
    const symbol = client.transaction.option?.info.symbol;
    const decimals = client.transaction.option?.info.decimals;
    if (!isNil(symbol) && !isEmpty(symbol) && !isNil(decimals) && !isEmpty(decimals)) {
      return TRANSACTION_TYPE.ERC20_TOKEN;
    }
  }

  return TRANSACTION_TYPE.SMART_CONTRACT;
}

export { getTransactionType };
