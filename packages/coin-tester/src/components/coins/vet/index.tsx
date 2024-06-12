/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import web3 from 'web3';

import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import { txKeys, txValues, tokenKeys, tokenValues } from './utils/defaultArguments';
import * as api from './utils/api';

import VET from '@coolwallet/vet';
import { useRequest } from '../../../utils/hooks';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinVet(props: Props) {
  const vet = new VET();

  // Account

  const [keyIndex, setKeyIndex] = useState(0);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');

  // Transaction

  const [txArgs, setTxArgs] = useState(txValues);
  const [signedTx, setSignedTx] = useState('');
  const [txResult, setTxResult] = useState('');

  const [tokenArgs, setTokenArgs] = useState(tokenValues);
  const [signedToken, setSignedToken] = useState('');
  const [tokenResult, setTokenResult] = useState('');

  const [certContent, setCertContent] = useState('new message');
  const [certificate, setCertificate] = useState('');

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
      return await vet.getAddress(transport!, appPrivateKey, appId, keyIndex);
    }, setAddress);
  };

  const getBalance = async () => {
    handleState(async () => {
      return await api.getBalance(address);
    }, setBalance);
  };

  const signTransaction = () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const cwParam = { transport: transport!, appPrivateKey, appId, addressIndex: 0 };

      const [blockRef, expiration, gasPriceCoef, gas, dependsOn, nonce, features, to, value, data] = txArgs;

      const txParam = {
        blockRef,
        expiration: parseInt(expiration),
        clauses: [
          {
            to,
            value: new BigNumber(value).shiftedBy(18).toFixed(),
            data,
          },
        ],
        gasPriceCoef: parseInt(gasPriceCoef),
        gas: parseInt(gas),
        dependsOn,
        nonce,
        reserved: {
          features: parseInt(features)
        }
      };

      const signedTx = await vet.signTransaction(cwParam, txParam);
      console.log('signedTx :', signedTx);

      // const result = await api.sendTx(signedTx);

      return signedTx;
    }, setSignedTx)
  };

  const signToken = () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const cwParam = { transport: transport!, appPrivateKey, appId, addressIndex: 0 };

      const [blockRef, expiration, gasPriceCoef, gas, dependsOn, nonce, isVip191, contractAddress, recipient, value, symbol, decimals] = tokenArgs;

      const tokenParam = {
        blockRef,
        expiration: parseInt(expiration),
        gasPriceCoef: parseInt(gasPriceCoef),
        gas: parseInt(gas),
        dependsOn,
        nonce,
        isVip191: !!parseInt(isVip191),
        contractAddress,
        recipient,
        value: new BigNumber(value).shiftedBy(18).toFixed(),
        symbol,
        decimals: parseInt(decimals),
      };

      const signedTx = await vet.signToken(cwParam, tokenParam);
      console.log('signedTx :', signedTx);

      // const result = await api.sendTx(signedTx);

      return signedTx;
    }, setSignedToken);
  };

  const signCertificate = () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const cwParam = { transport: transport!, appPrivateKey, appId, addressIndex: 0 };

      const certParam = {
        purpose: 'identification',
        payload: {
          type: 'text',
          content: certContent,
        },
        domain: 'localhost',
        timestamp: 1545035330,
        signer: address,
      };

      const certificate = await vet.signCertificate(cwParam, certParam);
      return certificate;
    }, setCertificate);
  };

  return (
    <Container>
      <div className='title2'>Account</div>
      <OneInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
        btnName='Get'
        value={`${keyIndex}`}
        setNumberValue={setKeyIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <NoInput
        title='Get Balance'
        content={balance}
        onClick={getBalance}
        disabled={disabled}
        btnName='Get'
      />

      <div className='title2'>Signing</div>
      <ObjInputs
        title='Sign Tx'
        content={signedTx}
        onClick={signTransaction}
        disabled={disabled}
        keys={txKeys}
        values={txArgs}
        setValues={setTxArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Sign Token'
        content={signedToken}
        onClick={signToken}
        disabled={disabled}
        keys={tokenKeys}
        values={tokenArgs}
        setValues={setTokenArgs}
        btnName='Sign'
      />
      <OneInput
        title='Sign Certificate'
        content={certificate}
        onClick={signCertificate}
        disabled={disabled}
        btnName='Sign'
        value={certContent}
        setValue={setCertContent}
        placeholder={'new message'}
        inputSize={4}
      />

    </Container>
  );
}

export default CoinVet;
