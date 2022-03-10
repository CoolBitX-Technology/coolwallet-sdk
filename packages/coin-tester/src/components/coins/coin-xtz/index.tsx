import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import XTZ from '@coolwallet/coin-xtz';
import { PATH_STYLE } from '@coolwallet/coin-xtz';
import { TezosToolkit } from '@taquito/taquito';
import { SignTxData, xtzReveal, xtzTransaction, xtzDelegation, } from '@coolwallet/coin-xtz/lib/config/types';
import axios from 'axios';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinXTZ(props: Props) {

  const xtz = new XTZ(PATH_STYLE.XTZ);
  
  const [index, setIndex] = useState('0');
  const [selectedIndex, setSelectedIndex] = useState('0');
  const [selectedNode, setSelectedNode] = useState('https://hangzhounet.api.tez.ie');
  const [node, setNode] = useState('https://hangzhounet.api.tez.ie');
  const [pubkeyhash, setPubkeyHash] = useState('');
  const [address, setAddress] = useState('');
  const [revealNeeded, checkRevealNeeded] = useState('');
  const [signedReveal, setSignedReveal] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('3000000');
  const [to, setTo] = useState('tz1erET3QwafBppScF62xX8NzNBTbw1SUaNb');
  const [signedDelegation, setSignedDelegation] = useState('');
  const [baker, setBaker] = useState('tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9');
  const [signedUndelegation, setSignedUndelegation] = useState('');

  const { transport, appPrivateKey } = props;
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

  const getCounter = async (node: string, address: string)  => {
    if(node == 'https://hangzhounet.api.tez.ie') {
      const url = 'https://api.hangzhou2net.tzkt.io/v1/accounts/' + address + '/counter';
      const response = await axios.get(url);
      console.log(response.data);
      return (parseInt(response.data)+1).toString();
    } else {
      const url = 'https://api.mainnet.tzkt.io/v1/accounts/' + address + '/counter';
      const response = await axios.get(url);
      return (parseInt(response.data)+1).toString();
    }
};

  const getPubkeyHash = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return xtz.getPublicKeyHash(transport!, appPrivateKey, appId, selectedIndex);
    }, setPubkeyHash);
  };

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return xtz.getAddress(transport!, appPrivateKey, appId, selectedIndex);
    }, setAddress);
  };

 const changeNode = async () => {
    handleState(async () => {
      return node;
    }, setSelectedNode);
  };

  const changeIndex = async () => {
    handleState(async () => {
      return index;
    }, setSelectedIndex);
  };

  const checkReveal = async () => {
    handleState(async () => {
      if(address == '') {
        return 'Get address first';
      }
      const Tezos = new TezosToolkit(node);
      const manager = await Tezos.rpc.getManagerKey(address);
      const haveManager = manager && typeof manager === 'object' ? !!manager.key : !!manager;
      return (!haveManager).toString(); 
    }, checkRevealNeeded);
  };

  const signReveal = async () => {
    handleState(async () => {

      if(address == '' || pubkeyhash == '') {
        return 'Get public key hash and address first';
      }

      const Tezos = new TezosToolkit(selectedNode);

      // For verification
      // const operation: xtzReveal = {
      //   branch: 'BKiXcfN1ZTXnNNbTWSRArSWzVFc6om7radWq5mTqGX6rY4P2Uhe',
      //   source: address,
      //   fee: "1300",
      //   counter: "3325582",
      //   gas_limit: "10100",
      //   storage_limit: "1",
      //   public_key: pubkeyhash,
      // };

      // For validation
      const operation: xtzReveal = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: "1300",
        counter: await getCounter(selectedNode, address),
        gas_limit: "10100",
        storage_limit: "500",
        public_key: pubkeyhash,
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: selectedIndex
      };

      const signedTx = await xtz.signReveal(signTxData, operation);
      console.debug('Reveal Submit Operation\n', signedTx);

      const txId = await Tezos.rpc.injectOperation(signedTx);
      if(node == 'https://hangzhounet.api.tez.ie')
        return 'https://hangzhou2net.tzkt.io/' + txId;
      else
        return 'https://tzkt.io/' + txId;
    }, setSignedReveal);
  };

  const signTransaction = async () => {
    handleState(async () => {
 
      if(address == '' || value == '' || to == '') {
        return 'Get address and check amount and destination first';
      }

      const Tezos = new TezosToolkit(selectedNode);

      // For verification
      // const operation: xtzTransaction = {
      //   branch: 'BKiXcfN1ZTXnNNbTWSRArSWzVFc6om7radWq5mTqGX6rY4P2Uhe',
      //   source: address,
      //   fee: "1300",
      //   counter: "3325582",
      //   gas_limit: "10100",
      //   storage_limit: "1",
      //   amount: "3000000",
      //   destination: "tz1erET3QwafBppScF62xX8NzNBTbw1SUaNb"
      // };

      // For validation
      const operation: xtzTransaction = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: "1350",
        counter: await getCounter(selectedNode, address),
        gas_limit: "10100",
        storage_limit: "400",
        amount: value,
        destination: to
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: selectedIndex
      };

      const signedTx = await xtz.signTransaction(signTxData, operation);
      console.debug('Transaction Submit Operation\n', signedTx);
      
      const txId = await Tezos.rpc.injectOperation(signedTx);
      if(node == 'https://hangzhounet.api.tez.ie')
        return 'https://hangzhou2net.tzkt.io/' + txId;
      else
        return 'https://tzkt.io/' + txId;
    }, setSignedTransaction);
  };

  const setDelegation = async () => {
    handleState(async () => {
 
      if(address == '' || baker == '') {
        return 'Get address and check baker first';
      }

      const Tezos = new TezosToolkit(selectedNode);

      // For verification
      // const operation: xtzDelegation = {
      //   branch: 'BKiXcfN1ZTXnNNbTWSRArSWzVFc6om7radWq5mTqGX6rY4P2Uhe',
      //   source: address,
      //   fee: "1300",
      //   counter: "3325582",
      //   gas_limit: "10100",
      //   storage_limit: "1",
      //   delegate: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9"
      // };

      // For validation
      const operation: xtzDelegation = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: "1300",
        counter: await getCounter(selectedNode, address),
        gas_limit: "10100",
        storage_limit: "400",
        delegate: baker
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: selectedIndex
      };

      const signedTx = await xtz.signDelegation(signTxData, operation);
      console.debug('Delegation Submit Operation\n', signedTx);     

      const txId = await Tezos.rpc.injectOperation(signedTx);
      if(node == 'https://hangzhounet.api.tez.ie')
        return 'https://hangzhou2net.tzkt.io/' + txId;
      else
        return 'https://tzkt.io/' + txId;
    }, setSignedDelegation);
  };

  const setUndelegation = async () => {
    handleState(async () => {
 
      if(address == '') {
        return 'Get address first';
      }

      const Tezos = new TezosToolkit(selectedNode);

      // For verification
      // const operation: xtzDelegation = {
      //   branch: 'BKiXcfN1ZTXnNNbTWSRArSWzVFc6om7radWq5mTqGX6rY4P2Uhe',
      //   source: address,
      //   fee: "1300",
      //   counter: "3325582",
      //   gas_limit: "10100",
      //   storage_limit: "1",
      // };

      // For validation
      const operation: xtzDelegation = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: "1300",
        counter: await getCounter(selectedNode, address),
        gas_limit: "10100",
        storage_limit: "400",
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        addressIndex: selectedIndex
      };

      const signedTx = await xtz.signUndelegation(signTxData, operation);
      console.debug('Undelegation Submit Operation\n', signedTx);

      const txId = await Tezos.rpc.injectOperation(signedTx);
      if(node == 'https://hangzhounet.api.tez.ie')
        return 'https://hangzhou2net.tzkt.io/' + txId;
      else
        return 'https://tzkt.io/' + txId;
    }, setSignedUndelegation);
  };

  return (
    <Container>
      <div className='title2'>
        These two basic methods are required to implement in a coin sdk.
      </div>
      <OneInput
        title='Index'
        content={selectedIndex}
        onClick={changeIndex}
        disabled={disabled}
        btnName='Set'
        value={index}
        setValue={setIndex}
        placeholder='Address (Account) Index'
        inputSize={1}
      /> 
      <NoInput
        title='Get PubKey Hash'
        content={pubkeyhash}
        onClick={getPubkeyHash}
        disabled={disabled}
      />
      <NoInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
      />
      <div className='title2'>
        Set Node<br></br>
        Mainnet URL: https://mainnet.api.tez.ie<br></br>
        Testnet URL: https://hangzhounet.api.tez.ie
      </div>
      <OneInput
        title='setnode'
        content={selectedNode}
        onClick={changeNode}
        disabled={disabled}
        btnName='Set'
        value={node}
        setValue={setNode}
        placeholder='Node URL'
        inputSize={4}
      /> 

      <NoInput
        title='Reveal Needed'
        content={revealNeeded}
        onClick={checkReveal}
        disabled={disabled}
      />
      <NoInput
        title='Reveal'
        content={signedReveal}
        onClick={signReveal}
        disabled={disabled}
        btnName='Reveal'
      />
      <TwoInputs
        title='Tranaction'
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
      <OneInput
        title='Delegation'
        content={signedDelegation}
        onClick={setDelegation}
        disabled={disabled}
        btnName='Delegate'
        value={baker}
        setValue={setBaker}
        placeholder='baker address'
        inputSize={3}
      />
      <NoInput
        title='Undelegation'
        content={signedUndelegation}
        onClick={setUndelegation}
        disabled={disabled}
        btnName='Undelegate'
      />
    </Container>
  );
}

export default CoinXTZ;