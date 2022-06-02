import * as types from '../config/types';
import { TezosToolkit } from '@taquito/taquito';

export const getTokenParameters = async (rawData: types.xtzToken): Promise<any> => {
  const { source, contractAddress, amount, tokenId, toAddress } = rawData;

  const url = 'https://mainnet.api.tez.ie/';
  const Tezos = new TezosToolkit(url);
  const contract = await Tezos.contract.at(contractAddress);
  const params = contract.methodsObject
    // .transfer([
    //   {
    //     from_: source,
    //     txs: [
    //       {
    //         to_: toAddress,
    //         token_id: tokenId,
    //         amount: amount,
    //       },
    //     ],
    //   },
    // ])
    .transfer({
      from: source,
      to: toAddress,
      value: amount
    })
    .toTransferParams().parameter;
  return params;
};
