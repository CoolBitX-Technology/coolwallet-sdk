import * as types from '../config/types';
import { TezosToolkit } from '@taquito/taquito';
import axios from 'axios';

export const getTokenInfo = async (contractAdr: string): Promise<any> => {
  const url = `https://api.tzkt.io/v1/contracts/${contractAdr}`;
  const { data: result } = await axios.get(url);
  return result;
};

export const getTokenParameters = async (rawData: types.xtzToken): Promise<any> => {
  const { source, contractAddress, tokenAmount, tokenId, toAddress } = rawData;
  const url = 'https://mainnet.api.tez.ie/';
  const Tezos = new TezosToolkit(url);
  const contract = await Tezos.contract.at(contractAddress);
  let params;
  const tokenStandardType = await getTokenInfo(contractAddress);
  if (tokenStandardType.tzips[0] === 'fa2' && tokenId !== undefined) {
    console.log('fa2');
    params = contract.methodsObject
      .transfer([
        {
          from_: source,
          txs: [
            {
              to_: toAddress,
              token_id: tokenId,
              amount: tokenAmount,
            },
          ],
        },
      ])
      .toTransferParams().parameter;
  } else {
    console.log('fa1.2');
    params = contract.methodsObject
      .transfer({
        from: source,
        to: toAddress,
        value: tokenAmount,
      })
      .toTransferParams().parameter;
  }
  return params;
};