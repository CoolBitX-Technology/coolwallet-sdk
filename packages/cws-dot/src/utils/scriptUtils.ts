import * as type from '../config/types'
import { utils } from '@coolwallet/core';
import * as params from '../config/params'

async function addPath(argument: string, addressIndex: number) {
  const SEPath = `15${await utils.getPath(params.COIN_TYPE, addressIndex)}`;
  return SEPath + argument;
}

export const getNormalTradeArgument = async (rawData: type.NormalMethod, addressIndex: number)
  : Promise<string> => {
  const argument = ''

  return addPath(argument, addressIndex);
};


