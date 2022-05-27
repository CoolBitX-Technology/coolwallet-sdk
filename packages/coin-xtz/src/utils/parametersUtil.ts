import * as types from '../config/types';
import { TezosToolkit } from '@taquito/taquito';

export const getTokenParameters = async (rawData: types.xtzToken): Promise<any> => {
  const { source, contractAddress, amount, token_id, toAddress } = rawData;

  const url = 'https://hangzhounet.smartpy.io/';
  const Tezos = new TezosToolkit(url);
  const contract = await Tezos.contract.at(contractAddress);
  const params = contract.methodsObject
    .transfer([
      {
        from_: source,
        txs: [
          {
            to_: toAddress,
            token_id: token_id,
            amount: amount,
          },
        ],
      },
    ])
    .toTransferParams().parameter;
  return params;
};
