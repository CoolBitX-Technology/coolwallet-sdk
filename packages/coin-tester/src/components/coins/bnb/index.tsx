import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import axios from 'axios';

import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput } from '../../../utils/componentMaker';

import BNB from '@coolwallet/bnb';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinBnb(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const bnb = new BNB();

  const [address, setAddress] = useState('');
  const [accountData, setAccountData] = useState({});
  const [chainId, setChainId] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');

  const handleState = async (
    request: () => Promise<string>,
    handleResponse: (response: string) => void
  ) => {
    props.setIsLocked(true);
    try {
      const response = await request();
      handleResponse(response);
    } catch (error: any) {
      handleResponse(error.message);
      console.error(error);
    } finally {
      props.setIsLocked(false);
    }
  };

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const address = await bnb.getAddress(transport!, appPrivateKey, appId, 0);
      // const { data } = await axios.get(`https://dex.binance.org/api/v1/account/${address}`);
      // setAccountData(data);
      return address;
    }, setAddress);
  };

  const getChainId = async () => {
    handleState(async () => {
      const response = await axios.get(`https://dex.binance.org/api/v1/node-info`);
      return response.data.node_info.network;
    }, setChainId);
  };

  const getCoins = (value: string | number): { amount: number; denom: string; } => {
    const coin = {
      amount: new BigNumber(value).multipliedBy(Math.pow(10, 8)).toNumber(),
      //parseFloat(value) * Math.pow(10, 8),
      denom: "BNB"
    }
    return coin
  }

  const signTransaction = async () => {
    handleState(async () => {
      const msg = {
        inputs: [
          {
            address,
            coins: [getCoins('3000000')],
          },
        ],
        outputs: [
          {
            address,
            coins: [getCoins('3000000')],
          },
        ],
      };

      const signObj = {
        account_number: '3000000',
        chain_id: chainId,
        data: null,
        memo: '',
        msgs: [msg],
        sequence: '0',
        source: "711"
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const { accountPublicKey, accountChainCode } = await bnb.getAccountPubKeyAndChainCode(transport!, appPrivateKey, appId);
      const publicKey = bnb.getAddressPublicKey(accountPublicKey, accountChainCode, 0);
      console.log('publicKey :', publicKey);
      const signTxData = {
        transport: transport,
        appPrivateKey: appPrivateKey,
        appId: appId,
        signObj: signObj,
        signPublicKey: Buffer.from(publicKey, 'hex'),
        addressIndex: 0,
      };
      const signedTx = await bnb.signTransaction(signTxData, false);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setSignedTransaction);
  };

  return (
    <Container>
      <div className='title2'>
        These two basic methods are required to implement in a coin sdk.
      </div>
      <NoInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
      />
      <NoInput
        title='Get Chain Id'
        content={chainId}
        onClick={getChainId}
        disabled={disabled}
      />
      <NoInput
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
      />
    </Container>
  );
}

export default CoinBnb;
