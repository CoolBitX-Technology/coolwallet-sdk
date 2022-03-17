import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import { SignDataType, TX_TYPE, CHAIN_ID } from '@coolwallet/cro/lib/config/types';
import BigNumber from 'bignumber.js';

import cosmosjs from './cosmos';
import Cro from '@coolwallet/cro';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked: boolean) => void,
}

function CoinCro(props: Props) {
  const cro = new Cro();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('cro1afl0lvvlrde2xh7p2a45re6uvrneelhhg8z287');

  const[delegateValue, setDelegateValue] = useState('0');
  const[signedDelegate, setSignedDelegate] = useState('');
  //const[delegatorAddress] = useState('cro139nl5fnhlxu2asduu5zqq8zzev0632jl2uupl8');
  const[validatorAddress] = useState('crocncl139nl5fnhlxu2asduu5zqq8zzev0632jlf3lgam');

  const[undelegateValue, setUndelegateValue] = useState('0');
  const[signedUndelegate, setSignedUndelegate] = useState('');

  const[signedWithdraw, setSignedWithdraw] = useState('');

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const handleState = async (
    request: () => Promise<string>,
    handleResponse: (response: string) => void
  ) => {
    props.setIsLocked(true);
    try {
      const response = await request();
      console.log("Response :", response);
      handleResponse(response);
    } catch (error) {
      handleResponse(error.message);
      console.log(error);
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
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: CHAIN_ID.CRO,
        txType: TX_TYPE.SEND,
        fromAddress: address,
        toAddress: to,
        amount: new BigNumber(value).multipliedBy(100000000).toNumber(),
        feeAmount: 10000,
        gas: 300000,
        accountNumber: account_number,
        sequence,
        memo: 'test signature',
      };
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.SEND,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      }
      const signedTx = await cro.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcast(signedTx);
      console.log("sendTx: " + sendTx);
      return sendTx;
    }, setSignedTransaction);
  };

  const signDelegate = async() =>{
      handleState(async () => {
        const { sequence, account_number } = await cosmosjs.getSequence(address);
        const transaction = {
          chainId: CHAIN_ID.CRO,
          delegatorAddress: address,
          validatorAddress,
          amount: new BigNumber(delegateValue).multipliedBy(100000000).toNumber(),
          feeAmount: 10000,
          gas: 300000,
          accountNumber: account_number,
          sequence,
          memo: '',
        };
        console.log(transaction);
        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signTxData: SignDataType = {
          txType: TX_TYPE.DELEGATE,
          transaction: transaction,
          transport: transport!,
          appPrivateKey,
          appId,
          addressIndex: 0,
          confirmCB: undefined,
          authorizedCB: undefined,
        }
        const signedTx = await cro.signTransaction(signTxData);
        console.log("signedTx: " + signedTx);
        const sendTx = await cosmosjs.broadcast(signedTx);
        console.log("sendTx: " + sendTx);
        return sendTx;
      }, setSignedDelegate);
  };

  const signUndelegate = async() =>{
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: CHAIN_ID.CRO,
        delegatorAddress: address,
        validatorAddress,
        amount: new BigNumber(undelegateValue).multipliedBy(100000000).toNumber(),
        feeAmount: 10000,
        gas: 300000,
        accountNumber: account_number,
        sequence,
        memo: '',
      };
      console.log(transaction);
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData: SignDataType = {
        txType: TX_TYPE.UNDELEGATE,
        transaction: transaction,
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: 0,
        confirmCB: undefined,
        authorizedCB: undefined,
      }
      const signedTx = await cro.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcast(signedTx);
      console.log("sendTx: " + sendTx);
      return sendTx;
    }, setSignedUndelegate);
  }

    const signWithdraw = async() =>{
      handleState(async () => {
        const { sequence, account_number } = await cosmosjs.getSequence(address);
        const transaction = {
          chainId: CHAIN_ID.CRO,
          delegatorAddress: address,
          validatorAddress,
          feeAmount: 10000,
          gas: 300000,
          accountNumber: account_number,
          sequence,
          memo: '',
        };
        console.log(transaction);
        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signTxData: SignDataType = {
          txType: TX_TYPE.WITHDRAW,
          transaction: transaction,
          transport: transport!,
          appPrivateKey,
          appId,
          addressIndex: 0,
          confirmCB: undefined,
          authorizedCB: undefined,
        }
        const signedTx = await cro.signTransaction(signTxData);
        console.log("signedTx: " + signedTx);
        const sendTx = await cosmosjs.broadcast(signedTx);
        console.log("sendTx: " + sendTx);
        return sendTx;
      }, setSignedWithdraw);
  };

  return (
    <Container>
      <div className='title2'>
        These basic methods are required to implement in a coin sdk.
      </div>
      <NoInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
      />
      {<TwoInputs
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
        value={value}
        setValue={setValue}
        placeholder='value'
        inputSize={1}
        value2={to}
        setValue2={setTo}
        placeholder2='to'
        inputSize2={3}
      />}
      {<OneInput
        title='Delegate' 
        content={signedDelegate} 
        onClick={signDelegate}
        disabled={disabled}
        btnName='Delegate'
        value={delegateValue}
        setValue={setDelegateValue}
        placeholder='delegateValue'
        inputSize={1}
      />}
      {<OneInput
        title='Undelegate' 
        content={signedUndelegate} 
        onClick={signUndelegate}
        disabled={disabled}
        btnName='Undelegate'
        value={undelegateValue}
        setValue={setUndelegateValue}
        placeholder='undelegateValue'
        inputSize={1}
      />}
      {<NoInput
        title='Withdraw' 
        content={signedWithdraw} 
        onClick={signWithdraw}
        disabled={disabled}
        btnName='Withdraw'
      />}
    </Container>
  );
}

export default CoinCro;