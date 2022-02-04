import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import Theta, { Options, SendTransaction } from '@coolwallet/theta';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import {
  sendKeys,
  sendValues,
  stakeValidatorKeys,
  stakeValidatorValues,
  stakeGuardianKeys,
  stakeGuardianValues,
  stakeEdgeKeys,
  stakeEdgeValues,
  withdrawKeys,
  withdrawValues,
  smartKeys,
  smartValues,
} from './utils/defaultArguments';
import {
  getAccount,
  fetchGuardianNodeDelegates,
  callSmartContract,
  broadcastTx,
  sendEvmTx,
} from './utils/api';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinTheta(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const coin = new Theta();

  // Address
  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('0x2E833968E5bB786Ae419c4d13189fB081Cc43bab');

  // APIs
  const [accountInfo, setAccountInfo] = useState('');
  const [guardianNodes, setGuardianNodes] = useState('');
  const [signedTx, setSignedTx] = useState('');
  const [gasUsed, setGasUsed] = useState('');

  // Send Tx
  const [sendArgs, setSendArgs] = useState(sendValues);
  const [sendTx, setSendTx] = useState('');

  // Stake Validator Tx
  const [stakeValidatorArgs, setStakeValidatorArgs] = useState(stakeValidatorValues);
  const [stakeValidatorTx, setStakeValidatorTx] = useState('');

  // Stake Guardian Tx
  const [stakeGuardianArgs, setStakeGuardianArgs] = useState(stakeGuardianValues);
  const [stakeGuardianTx, setStakeGuardianTx] = useState('');

  // Stake Edge Tx
  const [stakeEdgeArgs, setStakeEdgeArgs] = useState(stakeEdgeValues);
  const [stakeEdgeTx, setStakeEdgeTx] = useState('');

  // Withdraw Tx
  const [withdrawArgs, setWithdrawArgs] = useState(withdrawValues);
  const [withdrawTx, setWithdrawTx] = useState('');

  // Smart Tx
  const [smartArgs, setSmartArgs] = useState(smartValues);
  const [smartTx, setSmartTx] = useState('');

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
      return coin.getAddress(transport!, appPrivateKey, appId, addressIndex);
    }, setAddress);
  };

  const getAccountInfo = async () => {
    handleState(async () => {
      if (!address) throw new Error('need address!');
      const account = await getAccount(address);
      const sequence = account.sequence;
      const { thetawei, tfuelwei } = account.coins;
      const theta = new BigNumber(thetawei).shiftedBy(-18).toFixed();
      const tfuel = new BigNumber(tfuelwei).shiftedBy(-18).toFixed();
      return `sequence=${sequence}, theta=${theta}, tfuel=${tfuel}`;
    }, setAccountInfo);
  };

  const getGuardianNodes = async () => {
    handleState(async () => {
      const results = await fetchGuardianNodeDelegates();
      console.log('results :', results);
      return results.map((result: any) => {
        return `${result.name}`;
      }).join(', ');
    }, setGuardianNodes);
  };

  const getGasUsed = async () => {
    handleState(async () => {
      if (!signedTx) throw new Error('need signedTx!');
      const result = await callSmartContract(signedTx);
      console.log('result :', result);
      const { contract_address, gas_used, vm_error, vm_return } = result;
      if (vm_error) throw new Error(vm_error);
      return gas_used;
    }, setGasUsed);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [theta, tfuel, sequence, fromAddr, toAddr] = sendArgs;
      theta = new BigNumber(theta).shiftedBy(18).toFixed();
      tfuel = new BigNumber(tfuel).shiftedBy(18).toFixed();
      const transaction = { theta, tfuel, sequence, fromAddr, toAddr };
      const signedTx = await coin.signTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return broadcastTx(signedTx);
    }, setSendTx);
  };

  const signStakeValidator = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [theta, sequence, fromAddr, toAddr] = stakeValidatorArgs;
      theta = new BigNumber(theta).shiftedBy(18).toFixed();
      const transaction = { theta, sequence, fromAddr, toAddr };
      const signedTx = await coin.signStakeValidatorTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return broadcastTx(signedTx);
    }, setStakeValidatorTx);
  };

  const signStakeGuardian = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [theta, sequence, fromAddr, holderSummary] = stakeGuardianArgs;
      theta = new BigNumber(theta).shiftedBy(18).toFixed();
      const transaction = { theta, sequence, fromAddr, holderSummary };
      const signedTx = await coin.signStakeGuardianTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return broadcastTx(signedTx);
    }, setStakeGuardianTx);
  };

  const signStakeEdge = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [tfuel, sequence, fromAddr, holderSummary] = stakeEdgeArgs;
      tfuel = new BigNumber(tfuel).shiftedBy(18).toFixed();
      const transaction = { tfuel, sequence, fromAddr, holderSummary };
      const signedTx = await coin.signStakeEdgeTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return broadcastTx(signedTx);
    }, setStakeEdgeTx);
  };

  const signWithdraw = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      const [purpose, sequence, fromAddr, toAddr] = withdrawArgs;
      const transaction = { purpose, sequence, fromAddr, toAddr };
      const signedTx = await coin.signWithdrawTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return broadcastTx(signedTx);
    }, setWithdrawTx);
  };

  const signSmart = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };
      let [value, sequence, fromAddr, toAddr, gasLimit, data] = smartArgs;
      value = new BigNumber(value).shiftedBy(18).toFixed();
      const transaction = { value, sequence, fromAddr, toAddr, gasLimit, data };
      const signedTx = await coin.signEvmTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return sendEvmTx(signedTx);
    }, setSmartTx);
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
        title='Guardian Nodes'
        content={guardianNodes}
        onClick={getGuardianNodes}
        disabled={disabled}
        btnName='Get'
      />
      <OneInput
        title='Get Gas Used'
        content={gasUsed}
        onClick={getGasUsed}
        disabled={disabled}
        btnName='Get'
        value={`${signedTx}`}
        setValue={setSignedTx}
        placeholder={''}
        inputSize={4}
      />
      <div className='title2'>Transactions</div>
      <ObjInputs
        title='Send'
        content={`${sendTx}`}
        onClick={signTransaction}
        disabled={disabled}
        keys={sendKeys}
        values={sendArgs}
        setValues={setSendArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Stake Validator'
        content={`${stakeValidatorTx}`}
        onClick={signStakeValidator}
        disabled={disabled}
        keys={stakeValidatorKeys}
        values={stakeValidatorArgs}
        setValues={setStakeValidatorArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Stake Guardian'
        content={`${stakeGuardianTx}`}
        onClick={signStakeGuardian}
        disabled={disabled}
        keys={stakeGuardianKeys}
        values={stakeGuardianArgs}
        setValues={setStakeGuardianArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Stake Edge'
        content={`${stakeEdgeTx}`}
        onClick={signStakeEdge}
        disabled={disabled}
        keys={stakeEdgeKeys}
        values={stakeEdgeArgs}
        setValues={setStakeEdgeArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Withdraw'
        content={`${withdrawTx}`}
        onClick={signWithdraw}
        disabled={disabled}
        keys={withdrawKeys}
        values={withdrawArgs}
        setValues={setWithdrawArgs}
        btnName='Sign'
      />
      <ObjInputs
        title='Smart'
        content={`${smartTx}`}
        onClick={signSmart}
        disabled={disabled}
        keys={smartKeys}
        values={smartArgs}
        setValues={setSmartArgs}
        btnName='Sign'
      />
    </Container>
  );
}

export default CoinTheta;
