import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Dropdown, Form } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import { CHAIN_ID, TX_TYPE, SignDataType } from '@coolwallet/luna/lib/config/types';
import { DENOMTYPE } from "@coolwallet/terra/lib/config/denomType";
import BigNumber from 'bignumber.js';

//import cosmosjs from './cosmos';
import { Testnet, Mainnet } from './cosmos';
import Terra from '@coolwallet/terra';
import { DenomTrace } from '@terra-money/terra.js/dist/core/ibc-transfer/DenomTrace';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinTerra(props: Props) {
  const terra = new Terra();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  //const [to, setTo] = useState('terra1seckusy09dzgtyxtz9xqzg2x7xfgtf0lhyzmf9');
  const [to, setTo] = useState('terra1u29qtwr0u4psv8z2kn2tgxalf5efunfqj3whjv'); // Testnet - Wallet

  const[delegateValue, setDelegateValue] = useState('0');
  const[signedDelegate, setSignedDelegate] = useState('');
  //const[validatorAddress] = useState('terravaloper1259cmu5zyklsdkmgstxhwqpe0utfe5hhyty0at');
  const[validatorAddress] = useState('terravaloper15fl0fcnzreazj50x25rvyvr0rtn0nq2n742cxm'); // Testnet - Accomplice Blockchain


  const[undelegateValue, setUndelegateValue] = useState('0');
  const[signedUndelegate, setSignedUndelegate] = useState('');

  const[signedWithdraw, setSignedWithdraw] = useState('');

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const[feeAmount, setFeeAmount] = useState(0.0012);
  const[feeDenom, setFeeDenom] = useState(DENOMTYPE.LUNA);
  const[denom, setDenom] = useState(DENOMTYPE.LUNA);
  const[cosmosjs, setNetwork] = useState(Testnet);
  const[chainId, setChainId] = useState(CHAIN_ID.TEST);
  const[netLabel, setNetLabel] = useState("Test Net");

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

  const handleNetChange = (e)=>{
    if('Test Net' === e){
      setNetwork(Testnet);
      setChainId(CHAIN_ID.TEST);
    }
    else{
      setNetwork(Mainnet);
      setChainId(CHAIN_ID.MAIN);
    }
    setNetLabel(e); 
  }

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return terra.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const { sequence, account_number } = await cosmosjs.getSequence(address);
      const transaction = {
        chainId: chainId,
        fromAddress: address,
        toAddress: to,
        amount: new BigNumber(value).multipliedBy(1000000).toNumber(),
        feeAmount: new BigNumber(feeAmount).multipliedBy(1000000).toNumber(),
        gas: 85000,
        accountNumber: account_number,
        sequence,
        feeDenom: feeDenom,
        denom: denom,
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
      const signedTx = await terra.signTransaction(signTxData);
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
        chainId: chainId,
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
      const tempSignedTx = await terra.signTransaction(signTxData);
      console.log("tempSignedTx: " + tempSignedTx);

      const getGas = await cosmosjs.getGas(tempSignedTx);
      transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      console.log("new gas amount transaction: ");
      console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
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
        chainId: chainId,
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
      const tempSignedTx = await terra.signTransaction(signTxData);
      console.log("tempSignedTx: " + tempSignedTx);

      const getGas = await cosmosjs.getGas(tempSignedTx);
      transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      console.log("new gas amount transaction: ");
      console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
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
        chainId: chainId,
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
      const tempSignedTx = await terra.signTransaction(signTxData);
      console.log("tempSignedTx: " + tempSignedTx);

      const getGas = await cosmosjs.getGas(tempSignedTx);
      transaction.feeAmount = Math.round(parseFloat(getGas.slice(1, getGas.length - 1)) * 0.0134);
      transaction.gas = parseFloat(getGas.slice(1, getGas.length - 1));
      console.log("new gas amount transaction: ");
      console.log(transaction);

      const signedTx = await terra.signTransaction(signTxData);
      console.log("signedTx: " + signedTx);
      const sendTx = await cosmosjs.broadcastGRPC(signedTx);
      console.log("sendTx: " + sendTx);
      return sendTx;
    }, setSignedWithdraw);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={12}
            md={{ span: 8, offset: 2 }}
          >
            <Dropdown onSelect={handleNetChange}>
              <Dropdown.Toggle variant='danger'>
                {netLabel}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey='Test Net'>Test Net</Dropdown.Item>
                <Dropdown.Item eventKey='Main Net'>Main Net</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
      }
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
      {
        <Row style={{ marginBottom: '15px' }}>
          <Col 
            xs={2}
            md={{ span: 1, offset: 2 }}
          >Tx:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='success'>
                {denom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={2}
            md={1}>Fee:</Col>
          <Col 
            xs={2}>
            <Dropdown onSelect={(e)=>{setFeeDenom(DENOMTYPE[e])}}>
              <Dropdown.Toggle variant='primary'>
                {feeDenom.name}
              </Dropdown.Toggle>
            
              <Dropdown.Menu>
                {Object.values(DENOMTYPE).map(function(denomT){
                  return <Dropdown.Item key={'fee_'+denomT.name} eventKey={denomT.name}>{denomT.name}</Dropdown.Item>;
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col 
            xs={3}
            md={2}>
            <Form.Control 
              type='number'
              placeholder='Fee Amount'
              value={feeAmount}
              onChange={(event) => {
                setFeeAmount(event.target.value);
              }}
            />
          </Col>
        </Row>
      }
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

export default CoinTerra;
