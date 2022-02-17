import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import Web3 from 'web3';

import Cronos from '@coolwallet/coin-cronos';
import { Transaction } from '@coolwallet/coin-cronos/lib/config/types';

const web3 = new Web3('https://evm-cronos.crypto.org');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinCRONOS(props: Props) {
  const cronos = new Cronos();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [data, setData] = useState('');
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const handleState = async (request: () => Promise<string>, handleResponse: (response: string) => void) => {
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
      const address = await cronos.getAddress(transport!, appPrivateKey, appId, 0);
      return address;
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction: Transaction = {
        nonce: web3.utils.toHex(
          await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data })),
        to: to,
        value: web3.utils.toHex(web3.utils.toWei(value.toString(), 'ether')),
        data: data,
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const option = {
        info: { symbol: '', decimals: '' },
      };

      const signTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
        option,
      };

      const signedTx = await cronos.signTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  return (
    <Container>
      <div className="title2">These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title="Get Address" content={address} onClick={getAddress} disabled={disabled} />
      {
        <TwoInputs
          title="Sign Transaction"
          content={signedTransaction}
          onClick={signTransaction}
          disabled={disabled}
          btnName="Sign&Send"
          value={value}
          setValue={setValue}
          placeholder="value"
          inputSize={1}
          value2={to}
          setValue2={setTo}
          placeholder2="to"
          inputSize2={3}
        />
      }
    </Container>
  );
}

export default CoinCRONOS;
