import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';
import XTZ from '@coolwallet/xtz';
import { PATH_STYLE } from '@coolwallet/xtz';
import { 
  TezosToolkit, 
  WalletProvider, 
  DEFAULT_FEE, DEFAULT_GAS_LIMIT, DEFAULT_STORAGE_LIMIT, 
  WalletDelegateParams, WalletOriginateParams, WalletTransferParams, 
  createTransferOperation, createSetDelegateOperation, createOriginationOperation 
} from '@taquito/taquito';
import { SignTxData, xtzReveal, xtzTransaction, xtzDelegation, } from '@coolwallet/xtz/lib/config/types';
import axios from 'axios';
import { resolvePreset } from '@babel/core';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinXTZ(props: Props) {

  class mockCoolWallet implements WalletProvider {
    async getPKH() {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return xtz.getAddress(transport!, appPrivateKey, appId, selectedIndex);
    }

    async mapTransferParamsToWalletParams(params: () => Promise<WalletTransferParams>) {
      return createTransferOperation(await params());
    }

    async mapOriginateParamsToWalletParams(params: () => Promise<WalletOriginateParams<any>>) {
      return createOriginationOperation(await params() as any);
    }
    async mapDelegateParamsToWalletParams(params: () => Promise<WalletDelegateParams>) {
      return createSetDelegateOperation(await params() as any);
    }

    async sendOperations(params: any[]) {
      return undefined as any;
    }

  }

  const useDefaultEstimate = false;

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

  const getPubkey = async () => {
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
      // It is safe to use default estimate for Reveal operation
      let estimateFee = DEFAULT_FEE.REVEAL;
      let estimateGasLimit = DEFAULT_GAS_LIMIT.REVEAL;
      let estimateStorageLimit = 1/*DEFAULT_STORAGE_LIMIT.REVEAL*/;
 
      const operation: xtzReveal = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: estimateFee.toString(),
        counter: await getCounter(selectedNode, address),
        gas_limit: estimateGasLimit.toString(), 
        storage_limit: estimateStorageLimit == 0 ? "1" : estimateStorageLimit.toString(),
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
      let estimateFee = DEFAULT_FEE.TRANSFER;
      let estimateGasLimit = DEFAULT_GAS_LIMIT.TRANSFER;
      let estimateStorageLimit = 1/*DEFAULT_STORAGE_LIMIT.TRANSFER*/;

      if(useDefaultEstimate == false) {
        Tezos.setProvider({ wallet: new mockCoolWallet() });
        const est = await Tezos.estimate.transfer({to: to, amount: parseInt(value), mutez: true}); 
        estimateFee = est.suggestedFeeMutez;
        estimateGasLimit = est.gasLimit;
        estimateStorageLimit = est.storageLimit;
      }

      const operation: xtzTransaction = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: estimateFee.toString(),
        counter: await getCounter(selectedNode, address),
        gas_limit: estimateGasLimit.toString(),
        storage_limit: estimateStorageLimit == 0 ? "1" : estimateStorageLimit.toString(), 
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
      let estimateFee = DEFAULT_FEE.DELEGATION;
      let estimateGasLimit = DEFAULT_GAS_LIMIT.DELEGATION;
      let estimateStorageLimit = 1/*DEFAULT_STORAGE_LIMIT.DELEGATION*/;

      if(useDefaultEstimate == false) {
        Tezos.setProvider({ wallet: new mockCoolWallet() });
        const est = await Tezos.estimate.setDelegate({ source: address, delegate: baker });  
        estimateFee = est.suggestedFeeMutez;
        estimateGasLimit = est.gasLimit;
        estimateStorageLimit = est.storageLimit;
      }

      const operation: xtzDelegation = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: estimateFee.toString(),
        counter: await getCounter(selectedNode, address),
        gas_limit: estimateGasLimit.toString(),
        storage_limit: estimateStorageLimit == 0 ? "1" : estimateStorageLimit.toString(),
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
      let estimateFee = DEFAULT_FEE.DELEGATION;
      let estimateGasLimit = DEFAULT_GAS_LIMIT.DELEGATION;
      let estimateStorageLimit = 1/*DEFAULT_STORAGE_LIMIT.DELEGATION*/;

      if(useDefaultEstimate == false) {
        Tezos.setProvider({ wallet: new mockCoolWallet() });
        const est = await Tezos.estimate.setDelegate({ source: address });  
        estimateFee = est.suggestedFeeMutez;
        estimateGasLimit = est.gasLimit;
        estimateStorageLimit = est.storageLimit;
      }

      const operation: xtzDelegation = {
        branch: await Tezos.rpc.getBlockHash(),
        source: address,
        fee: estimateFee.toString(),
        counter: await getCounter(selectedNode, address),
        gas_limit: estimateGasLimit.toString(),
        storage_limit: estimateStorageLimit == 0 ? "1" : estimateStorageLimit.toString(),
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
        title='Get PubKey'
        content={pubkeyhash}
        onClick={getPubkey}
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