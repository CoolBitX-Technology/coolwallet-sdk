import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import { SignTxData, Transaction, Action, TxnType } from '@coolwallet/near/lib/config/types';
const sha256 = require("js-sha256");
import { BN } from 'bn.js';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinNear(props: Props) {
  const near = new Near();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');

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

  const getAddress = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const appPrivateKey = '4X9hqNchzMzCi3Btjiss5swoMJrDeSorT8zMcqki6oZCCYX79tguTcBSoaLJCzM8YAa9whGZdcCrbzeLKFNffbd4';

      // const keyPair = nearAPI.utils.key_pair.KeyPairEd25519.fromString(appPrivateKey);
      // const publicKey = keyPair.getPublicKey();

      return near.getAddress(transport, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const tstSender = 'alex_scn.testnet';
      const tstReceiver = 'alex_scn2.testnet';
      const tstAmount = '1.5';
      const tstValidator = '';
      const tstGas = '0.00003';
      const tstMethodName = '';
      const tstMethodArgs = []; 

      const provider = new nearAPI.providers.JsonRpcProvider("https://rpc.testnet.near.org");
      const appPrivateKey = '4X9hqNchzMzCi3Btjiss5swoMJrDeSorT8zMcqki6oZCCYX79tguTcBSoaLJCzM8YAa9whGZdcCrbzeLKFNffbd4';
      const keyPair = nearAPI.utils.key_pair.KeyPairEd25519.fromString(appPrivateKey);
      const publicKey = keyPair.getPublicKey();

      const accessKey = await provider.query(
        `access_key/${tstSender}/${publicKey.toString()}`, ''
      );

      const nonce = ++accessKey.nonce;

      const actionTransfer: Action = {
        txnType: TxnType.TRANSFER,
        amount: tstAmount
      };

      // const actionStake: Action = {
      //   txnType: TxnType.STAKE,
      //   amount: tstAmount,
      //   validatorPublicKey: tstValidator
      // };

      // const actionSmart: Action = {
      //   txnType: TxnType.SMART,
      //   amount: tstAmount,
      //   gas: tstGas,
      //   methodName: tstMethodName,
      //   methodArgs: tstMethodArgs
      // };

      const txnTransfer: Transaction = {
        sender: tstSender,
        publicKey: publicKey.toString(), 
        receiver: tstReceiver,
        nonce: nonce,
        recentBlockHash: accessKey.block_hash,
        action: actionTransfer
      };
      
      // const txnStake: Transaction = {
      //   sender: tstSender,
      //   publicKey: publicKey.toString(), 
      //   receiver: tstReceiver,
      //   nonce: nonce,
      //   recentBlockHash: accessKey.block_hash,
      //   action: actionTransfer
      // };

      // const txnSmart: Transaction = {
      //   sender: tstSender,
      //   publicKey: publicKey.toString(), 
      //   receiver: tstReceiver,
      //   nonce: nonce,
      //   recentBlockHash: accessKey.block_hash,
      //   action: actionTransfer
      // };

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txnTransfer
      }

      // const signTxData: SignTxData = {
      //   transport: transport!,
      //   appPrivateKey: appPrivateKey,
      //   appId: appId,
      //   addressIndex: 0,
      //   transaction: txnStake
      // }

      // const signTxData: SignTxData = {
      //   transport: transport!,
      //   appPrivateKey: appPrivateKey,
      //   appId: appId,
      //   addressIndex: 0,
      //   transaction: txnSmart
      // }

      const signedTx = await near.signTransaction(signTxData);

      return signedTx;
    }, setSignedTransaction);
  };

  
  return (
    <Container>
      <div className='title2'>
        These two basic methods are required to implement in a coin sdk.
      </div>
      <NoInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
      />
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
    </Container>
  );
}

export default CoinNear;