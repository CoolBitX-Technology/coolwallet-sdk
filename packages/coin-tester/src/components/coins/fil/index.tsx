/* eslint-disable @typescript-eslint/no-shadow */
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';

import { Transport } from '@coolwallet/core';
import Fil from '@coolwallet/fil';

import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import { transactionKeys, transactionValues } from './utils/defaultArguments';
import { getBalance, getNonce, estimateMessageGas, sendTx, getMessageList } from './utils/api';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinFil(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const fil = new Fil();

  // Address
  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('');

  // APIs
  const [accountInfo, setAccountInfo] = useState('');
  const [history, setHistory] = useState('');

  // Transaction
  const [transactionArgs, setTransactionArgs] = useState(transactionValues);
  const [transactionPrepare, setTransactionPrepare] = useState('');
  const [transactionTx, setTransactionTx] = useState('');
  const [transactionResult, setTransactionResult] = useState('');

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
      const fromAddr = await fil.getAddress(transport!, appPrivateKey, appId, addressIndex);
      const toAddr = await fil.getAddress(transport!, appPrivateKey, appId, addressIndex === 0 ? 1 : 0);
      const tempArgs = [...transactionArgs];
      tempArgs[0] = toAddr;
      setTransactionArgs(tempArgs);
      return fromAddr;
    }, setAddress);
  };

  const getAccountInfo = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const balance = await getBalance(address);
      const nonce = await getNonce(address);
      const fil = new BigNumber(balance).shiftedBy(-18).toFixed();

      const tempTransactionArgs = [...transactionArgs];
      tempTransactionArgs[1] = nonce.toString();
      setTransactionArgs(tempTransactionArgs);

      return `nonce=${nonce}, balance=${fil}`;
    }, setAccountInfo);
  };

  const getHistory = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const messageList = await getMessageList(address);
      return JSON.stringify(messageList);
    }, setHistory);
  };

  // Transaction

  const prepareTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const { GasLimit, GasFeeCap, GasPremium } = await estimateMessageGas({
        To: transactionArgs[0],
        From: address,
        Nonce: parseInt(transactionArgs[1]),
        Value: new BigNumber(transactionArgs[2]).shiftedBy(18).toFixed(),
        Method: parseInt(transactionArgs[6]),
        Params: transactionArgs[7]
      });

      const tempTransactionArgs = [...transactionArgs];
      tempTransactionArgs[3] = GasLimit.toString();
      tempTransactionArgs[4] = GasFeeCap;
      tempTransactionArgs[5] = GasPremium;
      setTransactionArgs(tempTransactionArgs);

      return `gasLimit: ${GasLimit}, gasFeeCap: ${GasFeeCap}, gasPremium: ${GasPremium}`;
    }, setTransactionPrepare);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };

      const [to, nonce, value, gasLimit, gasFeeCap, gasPremium, method, params] = transactionArgs;
      const transaction = {
        addressIndex,
        to,
        nonce,
        value: new BigNumber(transactionArgs[2]).shiftedBy(18).toFixed(),
        gasLimit,
        gasFeeCap,
        gasPremium,
        method: parseInt(method),
        params
      };
      console.log('transaction :', transaction);
      const signedTx = await fil.signTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return JSON.stringify(signedTx);
    }, setTransactionTx);
  };

  const sendTransaction = async () => {
    handleState(async () => {
      if (!transactionTx) new Error('No signed tx, please sign tx!');
      const txObj = JSON.parse(transactionTx);
      const result = await sendTx(txObj);
      console.log('result :', result);
      return JSON.stringify(result);
    }, setTransactionResult);
  };

  return (
    <Container>
      <div className='title2'>Address</div>
      <OneInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
        btnName='Get'
        value={`${addressIndex}`}
        setNumberValue={setAddressIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <div className='title2'>APIs</div>
      <NoInput title='Account Info'
        content={accountInfo}
        onClick={getAccountInfo}
        disabled={disabled}
        btnName='Get' />
      <NoInput
        title='Get History'
        content={history}
        onClick={getHistory}
        disabled={disabled}
        btnName='Get'
      />

      <div className='title2'>Transaction</div>
      <ObjInputs
        title='Estimate Gas'
        content={transactionPrepare}
        onClick={prepareTransaction}
        disabled={disabled}
        keys={transactionKeys}
        values={transactionArgs}
        setValues={setTransactionArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={transactionTx}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={transactionResult}
        onClick={sendTransaction}
        disabled={disabled}
        btnName='Send'
      />

    </Container>
  );
}

export default CoinFil;
