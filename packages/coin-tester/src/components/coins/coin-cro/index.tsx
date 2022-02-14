import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import Web3 from 'web3';

import CRO from '@coolwallet/coin-cro';
import { Transaction } from '@coolwallet/coin-cro/lib/config/types';
import Inputs from '../../Inputs';

const web3 = new Web3('https://evm-cronos.crypto.org');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinCRO(props: Props) {
  const cro = new CRO();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [smartContractTo, setSmartContractTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [smartContractSignature, setSmartContractSignature] = useState('');
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
      return cro.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction: Transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data })),
        to: to,
        value: web3.utils.toHex(web3.utils.toWei(value.toString(), 'ether')),
        data: data,
      } as Transaction;

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

      const signedTx = await cro.signTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  const signSmartContract = async () => {
    handleState(async () => {
      const transactionData = `0x${data}`;
      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data: transactionData })),
        to: smartContractTo,
        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
        data: transactionData,
      } as Transaction;
      console.log(transaction);

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

      const signedTx = await cro.signSmartContractTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setSmartContractSignature);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />

      <TwoInputs
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign&Send'
        value={value}
        setValue={setValue}
        placeholder='value'
        inputSize={1}
        value2={to}
        setValue2={setTo}
        placeholder2='to'
        inputSize2={3}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract'
        content={smartContractSignature}
        onClick={signSmartContract}
        disabled={disabled}
        inputs={[
          {
            value: smartContractTo,
            onChange: setSmartContractTo,
            placeholder: 'to',
          },
          {
            value: data,
            onChange: setData,
            placeholder: 'data arg',
          },
        ]}
      />
    </Container>
  );
}

export default CoinCRO;
