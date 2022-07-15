import { SDKError } from '@coolwallet/core/lib/error';
import isNil from 'lodash/isNil';
import { Coin } from '../proto/coin';
import type { ChainProps, CoinProps } from '../chain/base';

function getCoin(chain: ChainProps, coinProps: string | CoinProps): CoinProps {
  let coin;
  if (typeof coinProps === 'string') {
    coin = chain.getCoin(coinProps);
  } else {
    coin = coinProps;
  }
  if (isNil(coin)) {
    throw new SDKError(getCoin.name, 'Cannot get coin with given denom.');
  }
  return coin;
}

function getProtoCoin(chain: ChainProps, coinProps: string | CoinProps, amount: string | number): Coin {
  let coin;
  if (typeof coinProps === 'string') {
    coin = chain.getCoin(coinProps);
  } else {
    coin = coinProps;
  }
  if (isNil(coin)) {
    throw new SDKError(getProtoCoin.name, 'Cannot get coin with given denom.');
  }
  return new Coin(coin.getDenom(), amount);
}

export { getCoin, getProtoCoin };
