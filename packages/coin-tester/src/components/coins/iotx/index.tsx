/* eslint-disable @typescript-eslint/no-shadow */

import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import Iotx, { Options, Transfer } from '@coolwallet/iotx';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import {
  transferKeys,
  transferValues,
  executionKeys,
  executionValues,
  stakeCreateKeys,
  stakeCreateValues,
  stakeUnstakeKeys,
  stakeUnstakeValues,
  stakeWithdrawKeys,
  stakeWithdrawValues,
} from './utils/defaultArguments';
import {
  getAccount,
  getGasPrice,
  getGasLimit,
  getCandidates,
  getUnclaimedBalance,
  getBuckets,
  getTxByHash,
  getTxHashByAddress,
  sendTx,
} from './utils/api';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

const re = /^([0-9A-Fa-f]{2})+$/;
const checkHexChar = (hex: string) => {
  console.log('checkHex:', re.test(hex));
  if (hex === '' || re.test(hex)) return hex;
  throw new Error('invalid hex string');
};
const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
const handleHex = (hex: string) => checkHexChar(evenHexDigit(removeHex0x(hex)));

const prepareTx = async (address: string, args: any, actName?: string, actObj?: any) => {
  if (!address) throw new Error('need address!');
  const account = await getAccount(address);
  const nonce = account.pendingNonce.toString();
  const gasPrice = await getGasPrice();
  const estimateObj: any = { callerAddress: address };
  if (actName === 'transfer' || actName === 'execution') {
    estimateObj[actName] = actObj;
  } else {
    estimateObj.transfer = {};
  }
  console.log('estimateObj :', estimateObj);
  const gasLimit = await getGasLimit(estimateObj);
  const tempArgs = [...args];
  tempArgs[0] = nonce;
  tempArgs[1] = gasLimit;
  tempArgs[2] = gasPrice;
  return tempArgs;
};

function CoinIotx(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const iotx = new Iotx();

  // Address
  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('');

  // APIs
  const [accountInfo, setAccountInfo] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [candidates, setCandidates] = useState('');
  const [unclaimedBalance, setUnclaimedBalance] = useState('');
  const [buckets, setBuckets] = useState('');
  const [txHashes, setTxHashes] = useState('');
  const [actionHash, setActionHash] = useState('');
  const [actionInfo, setActionInfo] = useState('');

  // Transfer Tx
  const [transferArgs, setTransferArgs] = useState(transferValues);
  const [transferPrepare, setTransferPrepare] = useState('');
  const [transferTx, setTransferTx] = useState('');
  const [transferResult, setTransferResult] = useState('');

  // Execution Tx
  const [executionArgs, setExecutionArgs] = useState(executionValues);
  const [executionPrepare, setExecutionPrepare] = useState('');
  const [executionTx, setExecutionTx] = useState('');
  const [executionResult, setExecutionResult] = useState('');

  // StakeCreate Tx
  const [stakeCreateArgs, setStakeCreateArgs] = useState(stakeCreateValues);
  const [stakeCreatePrepare, setStakeCreatePrepare] = useState('');
  const [stakeCreateTx, setStakeCreateTx] = useState('');
  const [stakeCreateResult, setStakeCreateResult] = useState('');

  // StakeUnstake Tx
  const [stakeUnstakeArgs, setStakeUnstakeArgs] = useState(stakeUnstakeValues);
  const [stakeUnstakePrepare, setStakeUnstakePrepare] = useState('');
  const [stakeUnstakeTx, setStakeUnstakeTx] = useState('');
  const [stakeUnstakeResult, setStakeUnstakeResult] = useState('');

  // StakeWithdraw Tx
  const [stakeWithdrawArgs, setStakeWithdrawArgs] = useState(stakeWithdrawValues);
  const [stakeWithdrawPrepare, setStakeWithdrawPrepare] = useState('');
  const [stakeWithdrawTx, setStakeWithdrawTx] = useState('');
  const [stakeWithdrawResult, setStakeWithdrawResult] = useState('');

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
      const fromAddr = await iotx.getAddress(transport!, appPrivateKey, appId, addressIndex);
      const toAddr = await iotx.getAddress(transport!, appPrivateKey, appId, (addressIndex === 0) ? 1 : 0);
      let tempArgs = [...transferArgs];
      tempArgs[4] = toAddr;
      setTransferArgs(tempArgs);
      return fromAddr;
    }, setAddress);
  };

  const getAccountInfo = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const account = await getAccount(address);
      const nonce = account.pendingNonce;
      const balance = new BigNumber(account.balance).shiftedBy(-18).toFixed();

      const tempTransferArgs = [...transferArgs];
      tempTransferArgs[0] = nonce.toString();
      setTransferArgs(tempTransferArgs);

      return `nonce=${nonce}, balance=${balance}`;
    }, setAccountInfo);
  };

  const getCandidatesInfo = async () => {
    handleState(async () => {
      const candidates = await getCandidates();
      return JSON.stringify(candidates);
    }, setCandidates);
  };

  const getReward = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const balance = await getUnclaimedBalance(address);
      return balance;
    }, setUnclaimedBalance);
  };

  const getBucketsInfo = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const buckets = await getBuckets(address);
      return JSON.stringify(buckets);
    }, setBuckets);
  };

  const getTxHash = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const txHashes = await getTxHashByAddress(address);
      return JSON.stringify(txHashes);
    }, setTxHashes);
  };

  const getAction = async () => {
    handleState(async () => {
      if (!actionHash) throw new Error('need actionHash!');
      const actionInfo = await getTxByHash(actionHash);
      return JSON.stringify(actionInfo);
    }, setActionInfo);
  };

  // Transfer Tx

  const prepareTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const args = await prepareTx(address, transferArgs, 'transfer', {
        amount: new BigNumber(transferArgs[3]).shiftedBy(18).toFixed(),
        recipient: transferArgs[4],
        payload: Buffer.from(handleHex(transferArgs[5]), 'hex'),
      });
      setTransferArgs(args);
      return `nonce: ${args[0]}, gasPrice: ${args[1]}, gasLimit: ${args[2]}`;
    }, setTransferPrepare);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [nonce, gasLimit, gasPrice, amount, recipient, payload] = transferArgs;
      gasPrice = new BigNumber(gasPrice).shiftedBy(18).toFixed();
      amount = new BigNumber(amount).shiftedBy(18).toFixed();
      const transaction = { addressIndex, nonce, gasLimit, gasPrice, amount, recipient, payload };
      const signedTx = await iotx.signTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setTransferTx);
  };

  const sendTransaction = async () => {
    handleState(async () => {
      if (!transferTx) new Error('No signed tx, please sign tx!');
      const actionHash = await sendTx(transferTx, 'transfer');
      return actionHash;
    }, setTransferResult);
  };

  // Execution Tx

  const prepareExecution = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const args = await prepareTx(address, executionArgs, 'execution', {
        amount: new BigNumber(transferArgs[3]).shiftedBy(18).toFixed(),
        contract: executionArgs[4],
        data: Buffer.from(handleHex(executionArgs[5]), 'hex'),
      });
      setExecutionArgs(args);
      return `nonce: ${args[0]}, gasPrice: ${args[1]}, gasLimit: ${args[2]}`;
    }, setExecutionPrepare);
  };

  const signExecution = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [nonce, gasLimit, gasPrice, amount, contract, data] = executionArgs;
      gasPrice = new BigNumber(gasPrice).shiftedBy(18).toFixed();
      amount = new BigNumber(amount).shiftedBy(18).toFixed();
      const transaction = { addressIndex, nonce, gasLimit, gasPrice, amount, contract, data };
      const signedTx = await iotx.signExecution(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setExecutionTx);
  };

  const sendExecution = async () => {
    handleState(async () => {
      if (!executionTx) new Error('No signed tx, please sign tx!');
      const actionHash = await sendTx(executionTx, 'execution');
      return actionHash;
    }, setExecutionResult);
  };

  // StakeCreate Tx

  const prepareStakeCreate = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const args = await prepareTx(address, stakeCreateArgs);
      setStakeCreateArgs(args);
      return `nonce: ${args[0]}, gasPrice: ${args[1]}, gasLimit: ${args[2]}`;
    }, setStakeCreatePrepare);
  };

  const signStakeCreate = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [nonce, gasLimit, gasPrice, candidateName, amount, duration] = stakeCreateArgs;
      gasPrice = new BigNumber(gasPrice).shiftedBy(18).toFixed();
      amount = new BigNumber(amount).shiftedBy(18).toFixed();
      const transaction = {
        addressIndex, nonce, gasLimit, gasPrice, candidateName, amount, duration, isAuto:false
      };
      const signedTx = await iotx.signStakeCreate(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setStakeCreateTx);
  };

  const sendStakeCreate = async () => {
    handleState(async () => {
      if (!stakeCreateTx) new Error('No signed tx, please sign tx!');
      const actionHash = await sendTx(stakeCreateTx, 'stakeCreate');
      return actionHash;
    }, setStakeCreateResult);
  };

  // StakeUnstake Tx

  const prepareStakeUnstake = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const args = await prepareTx(address, stakeUnstakeArgs);
      setStakeUnstakeArgs(args);
      return `nonce: ${args[0]}, gasPrice: ${args[1]}, gasLimit: ${args[2]}`;
    }, setStakeUnstakePrepare);
  };

  const signStakeUnstake = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [nonce, gasLimit, gasPrice, bucketIndex] = stakeUnstakeArgs;
      gasPrice = new BigNumber(gasPrice).shiftedBy(18).toFixed();
      const transaction = { addressIndex, nonce, gasLimit, gasPrice, bucketIndex };
      const signedTx = await iotx.signStakeUnstake(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setStakeUnstakeTx);
  };

  const sendStakeUnstake = async () => {
    handleState(async () => {
      if (!stakeUnstakeTx) new Error('No signed tx, please sign tx!');
      const actionHash = await sendTx(stakeUnstakeTx, 'stakeUnstake');
      return actionHash;
    }, setStakeUnstakeResult);
  };

  // StakeWithdraw Tx

  const prepareStakeWithdraw = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const args = await prepareTx(address, stakeWithdrawArgs);
      setStakeWithdrawArgs(args);
      return `nonce: ${args[0]}, gasPrice: ${args[1]}, gasLimit: ${args[2]}`;
    }, setStakeWithdrawPrepare);
  };

  const signStakeWithdraw = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [nonce, gasLimit, gasPrice, bucketIndex] = stakeWithdrawArgs;
      gasPrice = new BigNumber(gasPrice).shiftedBy(18).toFixed();
      const transaction = { addressIndex, nonce, gasLimit, gasPrice, bucketIndex };
      const signedTx = await iotx.signStakeWithdraw(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setStakeWithdrawTx);
  };

  const sendStakeWithdraw = async () => {
    handleState(async () => {
      if (!stakeWithdrawTx) new Error('No signed tx, please sign tx!');
      const actionHash = await sendTx(stakeWithdrawTx, 'stakeWithdraw');
      return actionHash;
    }, setStakeWithdrawResult);
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
      <NoInput
        title='Account Info'
        content={accountInfo}
        onClick={getAccountInfo}
        disabled={disabled}
        btnName='Get'
      />
      <NoInput
        title='Get Candidates'
        content={candidates}
        onClick={getCandidatesInfo}
        disabled={disabled}
        btnName='Get'
      />
      <NoInput
        title='Get Unclaimed Balance'
        content={unclaimedBalance}
        onClick={getReward}
        disabled={disabled}
        btnName='Get'
      />
      <NoInput
        title='Get Buckets'
        content={buckets}
        onClick={getBucketsInfo}
        disabled={disabled}
        btnName='Get'
      />
      <NoInput
        title='Get TxHashes By Address'
        content={txHashes}
        onClick={getTxHash}
        disabled={disabled}
        btnName='Get'
      />
      <OneInput
        title='Get Action By TxHash'
        content={actionInfo}
        onClick={getAction}
        disabled={disabled}
        btnName='Get'
        value={`${actionHash}`}
        setValue={setActionHash}
        placeholder={''}
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

      <div className='title2'>Execution</div>
      <ObjInputs
        title='Estimate Gas'
        content={`${executionPrepare}`}
        onClick={prepareExecution}
        disabled={disabled}
        keys={executionKeys}
        values={executionArgs}
        setValues={setExecutionArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={executionTx}
        onClick={signExecution}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={executionResult}
        onClick={sendExecution}
        disabled={disabled}
        btnName='Send'
      />

      <div className='title2'>StakeCreate</div>
      <ObjInputs
        title='Estimate Gas'
        content={`${stakeCreatePrepare}`}
        onClick={prepareStakeCreate}
        disabled={disabled}
        keys={stakeCreateKeys}
        values={stakeCreateArgs}
        setValues={setStakeCreateArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={`${stakeCreateTx}`}
        onClick={signStakeCreate}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={stakeCreateResult}
        onClick={sendStakeCreate}
        disabled={disabled}
        btnName='Send'
      />

      <div className='title2'>StakeUnstake</div>
      <ObjInputs
        title='Estimate Gas'
        content={`${stakeUnstakePrepare}`}
        onClick={prepareStakeUnstake}
        disabled={disabled}
        keys={stakeUnstakeKeys}
        values={stakeUnstakeArgs}
        setValues={setStakeUnstakeArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={`${stakeUnstakeTx}`}
        onClick={signStakeUnstake}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={stakeUnstakeResult}
        onClick={sendStakeUnstake}
        disabled={disabled}
        btnName='Send'
      />

      <div className='title2'>StakeWithdraw</div>
      <ObjInputs
        title='Estimate Gas'
        content={`${stakeWithdrawPrepare}`}
        onClick={prepareStakeWithdraw}
        disabled={disabled}
        keys={stakeWithdrawKeys}
        values={stakeWithdrawArgs}
        setValues={setStakeWithdrawArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={`${stakeWithdrawTx}`}
        onClick={signStakeWithdraw}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={stakeWithdrawResult}
        onClick={sendStakeWithdraw}
        disabled={disabled}
        btnName='Send'
      />
    </Container>
  );
}

export default CoinIotx;
