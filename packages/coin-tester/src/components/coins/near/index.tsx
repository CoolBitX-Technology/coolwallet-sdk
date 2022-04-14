import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import { SignTxData, TransactionType, Action, TxnType } from '@coolwallet/near/lib/config/types';
const sha256 = require("js-sha256");
import { BN } from 'bn.js';
const base58 = require('bs58');

const tstReceiver = '';
const tstAmount = '0.5';
const tstValidator = 'ydgzeXHJ5Xyt7M1gXLxqLBW1Ejx6scNV5Nx2pxFM8su';
const tstGas = '0.00000000003';
// const tstCallId = 'meerkat.stakewars.testnet';
// const tstMethodName = 'get_balance';
// const tstMethodArgs = Buffer.from(JSON.stringify({}))
const tstCallId = 'cryptium.poolv1.near';
const tstMethodName = 'get_account';
const tstMethodArgs = Buffer.from(JSON.stringify({"account_id": "alice"}))
 
// const networkId = "testnet";
const networkId = "mainnet";
// const rpcUrl = "https://rpc.testnet.near.org";
const rpcUrl = "https://rpc.mainnet.near.org";

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinNear(props: Props) {
  const nearCoin = new Near();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [signedStakeTransaction, setSignedStakeTransaction] = useState('');
  const [signedSmartTransaction, setSignedSmartTransaction] = useState('');
  const [callTo, setCallTo] = useState(tstCallId);
  const [callMethod, setCallMethod] = useState(tstMethodName);
  const [transferTo, setTransferTo] = useState(tstReceiver);

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

      const publicKey = await nearCoin.getAddress(transport!, appPrivateKey, appId);

      return publicKey;
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');
      if (!transferTo) throw new Error('Enter receiver!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      let actionTransfer: Action = {
        txnType: TxnType.TRANSFER,
        amount: tstAmount
      };

      let txnTransfer: TransactionType = {
        receiver: transferTo,
        nonce: nonce,
        recentBlockHash: blockHash,
        action: actionTransfer
      };
      
      console.log(txnTransfer);

      let signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txnTransfer
      }

      const signedTx = await nearCoin.signTransaction(signTxData);
      console.log(signedTx);

      await propagateTxn(config, txnTransfer, signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  const signStakeTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      const actionStake: Action = {
        txnType: TxnType.STAKE,
        amount: tstAmount,
        validatorPublicKey: tstValidator
      };

      const txnStake: TransactionType = {
        nonce: nonce,
        recentBlockHash: blockHash,
        action: actionStake
      };

      console.log(txnStake);

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txnStake
      }

      const signedTx = await nearCoin.signTransaction(signTxData);
      console.log(signedTx);

      await propagateTxn(config, txnStake, signedTx);

      return signedTx;
    }, setSignedStakeTransaction);
  };

  const signSmartTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!address) throw new Error('Get address first!');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!tstCallId) throw new Error('Enter receiver!');
      if (!tstMethodName) throw new Error('Enter method name!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      const actionSmart: Action = {
        txnType: TxnType.SMART,
//        amount: tstAmount,
        gas: tstGas,
        methodName: callMethod,
        methodArgs: tstMethodArgs
      };


      const txnSmart: TransactionType = {
        receiver: callTo,
        nonce: nonce,
        recentBlockHash: blockHash,
        action: actionSmart
      };
      
      console.log(txnSmart);

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txnSmart
      }

      const signedTx = await nearCoin.signTransaction(signTxData);
      console.log(signedTx);

      await propagateTxn(config, txnSmart, signedTx);

      return signedTx;
    }, setSignedSmartTransaction);
  };

  const prepareSenderAccData = async (
      config: any,
      sender: string,
      publicKey: string,
    ): Promise<{nonce: number, blockHash: string}> => {
    const near = await nearAPI.connect(config);
    const accountS = await near.account(sender);
    try {
      const state = await accountS.state();
      console.log(accountS.accountId + ' amount: ' + state.amount);
    } catch {
      throw new Error('Create sender account!');
    }
    const provider = new nearAPI.providers.JsonRpcProvider(config.rpcUrl);

    const accessKey = await provider.query(
      `access_key/${sender}/${publicKey}`, ''
    );

    const nonce =  ++accessKey.nonce;

    const block = await accountS.connection.provider.block({ finality: 'final' });
    const blockHash = block.header.hash;

    return { nonce: nonce, blockHash: blockHash };
  }

  const propagateTxn = async (
    config: any,
    txn: any,
    sign: any
  ) => {

    const amount = nearAPI.utils.format.parseNearAmount(txn.action.amount);
  
    let actions: nearAPI.transactions.Action[];
  
    switch(txn.action.txnType) { 
      case TxnType.TRANSFER: { 
        actions = [nearAPI.transactions.transfer(new BN(amount!))];
        break;
      } 
      case TxnType.STAKE: { 
        actions = [nearAPI.transactions.stake(new BN(amount!), nearAPI.utils.key_pair.PublicKey.from(txn.action.validatorPublicKey!))]; 
        break; 
      } 
      case TxnType.SMART:
      case TxnType.SMARTNOAMOUNT: { 
        actions = [nearAPI.transactions.functionCall(txn.action.methodName!, txn.action.methodArgs!,
          new BN(nearAPI.utils.format.parseNearAmount(txn.action.gas)!), new BN(amount!))];
        break;  
      } 
    }

      // create transaction
    const transaction = nearAPI.transactions.createTransaction(
      txn.sender, 
      nearAPI.utils.key_pair.PublicKey.from(txn.publicKey), 
      txn.receiver,
      txn.nonce,
      actions, 
      nearAPI.utils.serialize.base_decode(txn.recentBlockHash)
    );

    const signedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: transaction,
      signature: new nearAPI.transactions.Signature({ 
        keyType: 0, 
        data: Buffer.from(sign.toString(), 'hex') 
      })
    });

    // send the transaction!
    try {
      // encodes signed transaction to serialized Borsh (required for all transactions)
      const signedSerializedTx = signedTransaction.encode();
      // sends transaction to NEAR blockchain via JSON RPC call and records the result
          const provider = new nearAPI.providers.JsonRpcProvider(config.rpcUrl);
      const result = await provider.sendJsonRpc(
        'broadcast_tx_commit', 
        [Buffer.from(signedSerializedTx).toString('base64')]
      );
      console.log(result);
      console.log('Transaction Results: ', result.transaction);
      console.log('--------------------------------------------------------------------------------------------');
      console.log('OPEN LINK BELOW to see transaction in NEAR Explorer!');
      console.log(`$https://explorer.${config.networkId}.near.org/transactions/${result.transaction.hash}`);
      console.log('--------------------------------------------------------------------------------------------');
    } catch(error) {
      console.log(error);
    }
  }
  
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
      <OneInput
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
        value={transferTo}
        setValue={setTransferTo}
        placeholder='transfer to'
        inputSize={3}
      />
      <NoInput
        title='Sign Stake'
        content={signedStakeTransaction}
        onClick={signStakeTransaction}
        disabled={disabled}
        btnName='Sign'
      />
      <TwoInputs
        title='Sign Smart Contract'
        content={signedSmartTransaction}
        onClick={signSmartTransaction}
        disabled={disabled}
        btnName='Sign'
        value={callTo}
        setValue={setCallTo}
        placeholder='account id'
        inputSize={2}
        value2={callMethod}
        setValue2={setCallMethod}
        placeholder2='method'
        inputSize2={2}
      />
    </Container>
  );
}

export default CoinNear;