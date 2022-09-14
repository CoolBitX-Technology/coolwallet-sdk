/* eslint-disable @typescript-eslint/no-shadow @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import { transferKeys, transferValues } from './utils/defaultArguments';
import {
  fundAccount,
  accountBalance,
  lookupAddressByAuthKey,
  getSequenceAndAuthKey,
  getChainId,
  getGasPrice,
  getGasLimit,
  getHistory,
  sendTx,
} from './utils/api';

import { Transport } from '@coolwallet/core';
import Aptos from '@coolwallet/aptos';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked:boolean) => void;
}

interface Account {
  address: string;
  sequence?: string;
  balance?: string;
}

function CoinAptos(props: Props) {
  const aptos = new Aptos();

  // Account

  const [keyIndex, setKeyIndex] = useState(0);
  const [authKey, setAuthKey] = useState('');
  const [accounts, setAccounts] = useState('');

  const [fundedAddr, setFundedAddr] = useState('');
  const [fundedValue, setFundedValue] = useState(6000);
  const [fundedResult, setFundedResult] = useState('');

  const [hisAddr, setHisAddr] = useState('');
  const [history, setHistory] = useState('');

  // Transaction

  const [transferArgs, setTransferArgs] = useState(transferValues);
  const [transferPrepare, setTransferPrepare] = useState('');
  const [transferTx, setTransferTx] = useState('');
  const [transferResult, setTransferResult] = useState('');

  const { transport, appPrivateKey} = props;
  const disabled = !transport || props.isLocked;

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

  // Account

  const getAuthKey = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const authKey = await aptos.getAuthKey(transport!, appPrivateKey, appId, keyIndex);

      // 清空 address
      setAccounts('');

      return authKey;
    }, setAuthKey);
  };

  const getAccounts = async () => {
    handleState(async () => {
      const originalAccount: Account = { address: '' };
      const rotatedAccount: Account = { address: '' };

      // original address

      {
        const { sequence, currentAuth } = await getSequenceAndAuthKey(authKey);
        if (currentAuth === null) {
          originalAccount.address = 'need to create';
        } else if (currentAuth === authKey) {
          originalAccount.address = currentAuth;
          originalAccount.sequence = sequence;
          originalAccount.balance = await accountBalance(authKey);
        } else {
          originalAccount.address = 'rotated to other authKey';
        }
      }

      // rotated address

      {
        const address = await lookupAddressByAuthKey(authKey);
        if (address) {
          const { sequence, currentAuth } = await getSequenceAndAuthKey(address);
          const balance = await accountBalance(address);
          rotatedAccount.address = address;
          rotatedAccount.sequence = sequence;
          rotatedAccount.balance = balance;
        } else {
          rotatedAccount.address = 'no rotated address';
        }
      }
      return JSON.stringify({ originalAccount, rotatedAccount });
    }, setAccounts);
  };

  const fund = async () => {
    handleState(async () => {
      if (!fundedAddr) throw new Error('need address!');
      await fundAccount(fundedAddr, fundedValue);
      const balance = await accountBalance(fundedAddr);
      return balance;
    }, setFundedResult);
  };

  const fetchHistory = async () => {
    handleState(async () => {
      if (!hisAddr) throw new Error('need address!');
      let result = await getHistory(hisAddr);
      result = result.map((tx: any)=>tx.payload.function);
      return JSON.stringify(result);
    }, setHistory);
  };

  // Transaction

  const prepareTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      // const args = await prepareTx(address, transferArgs, 'transfer', {
      //   amount: new BigNumber(transferArgs[3]).shiftedBy(18).toFixed(),
      //   recipient: transferArgs[4],
      //   payload: Buffer.from(handleHex(transferArgs[5]), 'hex'),
      // });
      // setTransferArgs(args);
      return ''; // `nonce: ${args[0]}, gasLimit: ${args[1]}, gasPrice: ${args[2]}`;
    }, setTransferPrepare);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };

      const [sender, sequence, receiver, rawAmount, gasLimit, gasPrice, expiration] = transferArgs;
      const amount = new BigNumber(rawAmount).shiftedBy(8).toFixed();
      const transaction = { keyIndex, sender, sequence, receiver, amount, gasLimit, gasPrice, expiration };
      console.log('transaction :', transaction);

      const signedTx = await aptos.signTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setTransferTx);
  };

  const sendTransaction = async () => {
    handleState(async () => {
      return '';
    }, setTransferResult);
  };

  return (
    <Container>
      <div className='title2'>Account</div>
      <OneInput
        title='Get AuthKey'
        content={authKey}
        onClick={getAuthKey}
        disabled={disabled}
        btnName='Get'
        value={`${keyIndex}`}
        setNumberValue={setKeyIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <NoInput
        title='Get Address'
        content={accounts}
        onClick={getAccounts}
        disabled={disabled}
        btnName='Get'
      />
      <TwoInputs
        title='Fund Address'
        content={fundedResult}
        onClick={fund}
        disabled={disabled}
        btnName='Fund'
        value={`${fundedAddr}`}
        setValue={setFundedAddr}
        value2={`${fundedValue}`}
        setNumberValue2={setFundedValue}
        placeholder={'address'}
        placeholder2={'amount'}
        inputSize={4}
        inputSize2={2}
      />
      <OneInput
        title='Get History'
        content={history}
        onClick={fetchHistory}
        disabled={disabled}
        btnName='Get'
        value={`${hisAddr}`}
        setValue={setHisAddr}
        placeholder={'address'}
        inputSize={4}
      />

      <div className='title2'>Transfer</div>
      <ObjInputs
        title='Estimate Gas'
        content={transferPrepare}
        onClick={prepareTransaction}
        disabled={disabled}
        keys={transferKeys}
        values={transferArgs}
        setValues={setTransferArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={transferTx}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={transferResult}
        onClick={sendTransaction}
        disabled={disabled}
        btnName='Send'
      />
    </Container>
  );
}

export default CoinAptos;
