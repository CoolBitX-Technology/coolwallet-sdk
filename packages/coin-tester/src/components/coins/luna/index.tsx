import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import { CHAIN_ID, TX_TYPE, SignDataType } from '@coolwallet/luna/lib/config/types';
import BigNumber from 'bignumber.js';

import cosmosjs from './cosmos';
import Luna from '@coolwallet/luna';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinLuna(props: Props) {
  const luna = new Luna();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('terra1seckusy09dzgtyxtz9xqzg2x7xfgtf0lhyzmf9');

  const[delegateValue, setDelegateValue] = useState('0');
  const[signedDelegate, setSignedDelegate] = useState('');
  const[validatorAddress] = useState('terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at');

  const[undelegateValue, setUndelegateValue] = useState('0');
  const[signedUndelegate, setSignedUndelegate] = useState('');

  const[signedWithdraw, setSignedWithdraw] = useState('');

  const[signedSmartContract, setSignedSmartContract] = useState('');

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
      return luna.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: CHAIN_ID.LUNA,
        fromAddress: address,
        toAddress: to,
        amount: new BigNumber(value).multipliedBy(1000000).toNumber(),
        feeAmount: 1000,
        gas: 85000,
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
      };
      const signedTx = await luna.signTransaction(signTxData);
      console.log('signedTx: ' + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log('sendTx: ' + sendTx);
      return sendTx;
    }, setSignedTransaction);
  };

  const signDelegate = async() =>{
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: CHAIN_ID.LUNA,
        delegatorAddress: address,
        validatorAddress,
        amount: new BigNumber(delegateValue).multipliedBy(1000000).toNumber(),
        feeAmount: 1000,
        gas: 21000,
        accountNumber: account_number,
        sequence,
        memo: '',
      };
      console.log("temp gas amount transaction: ");
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
      const tempSignedTx = await luna.signTransaction(signTxData);
      console.log("tempSignedTx: " + tempSignedTx);

      const getGas = await cosmosjs.getGas(tempSignedTx);
      transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0114);
      transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      console.log("new gas amount transaction: ");
      console.log(transaction);

      const signedTx = await luna.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);
      return sendTx;
    }, setSignedDelegate);
};

const signUndelegate = async() =>{
  handleState(async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId: CHAIN_ID.LUNA,
      delegatorAddress: address,
      validatorAddress,
      amount: new BigNumber(undelegateValue).multipliedBy(1000000).toNumber(),
      feeAmount: 1000,
      gas: 21000,
      accountNumber: account_number,
      sequence,
      memo: '',
    };
    console.log("temp gas amount transaction: ");
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
    const tempSignedTx = await luna.signTransaction(signTxData);
    console.log("tempSignedTx: " + tempSignedTx);

    const getGas = await cosmosjs.getGas(tempSignedTx);
    transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0114);
    transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
    console.log("new gas amount transaction: ");
    console.log(transaction);

    const signedTx = await luna.signTransaction(signTxData);
    console.log("signedTx: " + signedTx);
    const sendTx = await cosmosjs.broadcastGRPC(signedTx);
    console.log("sendTx: " + sendTx);
    return sendTx;
  }, setSignedUndelegate);
}

const signWithdraw = async() =>{
  handleState(async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    const transaction = {
      chainId: CHAIN_ID.LUNA,
      delegatorAddress: address,
      validatorAddress,
      feeAmount: 1000,
      gas: 21000,
      accountNumber: account_number,
      sequence,
      memo: '',
    };
    console.log("temp gas amount transaction: ");
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
    const tempSignedTx = await luna.signTransaction(signTxData);
    console.log("tempSignedTx: " + tempSignedTx);

    const getGas = await cosmosjs.getGas(tempSignedTx);
    transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0114);
    transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
    console.log("new gas amount transaction: ");
    console.log(transaction);

    const signedTx = await luna.signTransaction(signTxData);
    console.log("signedTx: " + signedTx);
    const sendTx = await cosmosjs.broadcastGRPC(signedTx);
    console.log("sendTx: " + sendTx);
    return sendTx;
  }, setSignedWithdraw);
};

const signSmartContract = async() =>{
  handleState(async () => {
    const { sequence, account_number } = await cosmosjs.getSequence(address);
    // based on the structure of the smart contract- execute_msg may be different and funds may be undefined
    const executeMsgObj = {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: 'uluna'
            }
          },
          amount: '1'
        }
      }
    };
    
    const transaction = {
      chainId: CHAIN_ID.LUNA,
      senderAddress: address,
      contractAddress: 'terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6',
      execute_msg: JSON.stringify(executeMsgObj),
      // funds: undefined,
      funds: {
        denom: 'uluna', 
        amount: new BigNumber(0.000001).multipliedBy(1000000).toNumber()
      },
      feeAmount: 3000,
      gas: 180000,
      accountNumber: account_number,
      sequence,
      memo: '',
    }
    console.log(transaction);
    const appId = localStorage.getItem('appId');
    if (!appId) throw new Error('No Appid stored, please register!');
    const signTxData: SignDataType = {
      txType: TX_TYPE.SMART,
      transaction: transaction,
      transport: transport!,
      appPrivateKey,
      appId,
      addressIndex: 0,
      confirmCB: undefined,
      authorizedCB: undefined,
    };
    const signedTx = await luna.signTransaction(signTxData);
    console.log("signedTx: " + signedTx);
    const sendTx = await cosmosjs.broadcastGRPC(signedTx);
    console.log("sendTx: " + sendTx);
    return sendTx;
  }, setSignedSmartContract);
};

  return (
    <Container>
      <div className='title2'>These are basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      <TwoInputs
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
      />
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
      {<NoInput
        title='Smart Contract' 
        content={signedSmartContract} 
        onClick={signSmartContract}
        disabled={disabled}
        btnName='Smart Contract'
      />}
    </Container>
  );
}

export default CoinLuna;
