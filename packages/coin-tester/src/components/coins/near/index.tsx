import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, OneInput } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import { SignTxData, TransactionType, Action, TxnType } from '@coolwallet/near/lib/config/types';
const sha256 = require("js-sha256");
import { BN } from 'bn.js';
const base58 = require('bs58');

const tstSender = 'alex_scn7.alex_scn2.testnet';
const tstReceiver = 'alex_scn2.testnet';
//const tstSender = 'bob.alice';
//const tstReceiver = 'alice';
const tstAmount = '1.5';
const tstValidatorName = 'node1';
const tstValidator = 'ydgzeXHJ5Xyt7M1gXLxqLBW1Ejx6scNV5Nx2pxFM8su';
const tstGas = '0.00003';
const tstMethodName = '';
const tstMethodArgs = []; 
    
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
  const [validator, setValidator] = useState(tstValidator);
  const [to, setTo] = useState(tstReceiver);

  const { transport, appPrivateKey, appPublicKey} = props;
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

      //const appPrivateKey = '4X9hqNchzMzCi3Btjiss5swoMJrDeSorT8zMcqki6oZCCYX79tguTcBSoaLJCzM8YAa9whGZdcCrbzeLKFNffbd4';

      // const keyPair = nearAPI.utils.key_pair.KeyPairEd25519.fromString(appPrivateKey);
      // const publicKey = keyPair.getPublicKey();

      const publicKey = await nearCoin.getAddress(transport!, appPrivateKey, appId);
      console.log('keys');
      console.log('private: ' + appPrivateKey);
      console.log('private58: ' + base58.encode(Buffer.from(appPrivateKey)));
      console.log('public: ' + publicKey);
      console.log('public58: ' + base58.encode(Buffer.from(publicKey)));
      const publicKeyShort = publicKey.substring(0, 32);
      console.log('publicShort: ' + publicKeyShort);
      console.log('publicShort58: ' + base58.encode(Buffer.from(publicKeyShort)));
      return publicKey;
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: "testnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc", // "https://rpc.testnet.near.org"
        rpcUrl: "https://rpc.testnet.near.org",
        headers: { 'x-api-key': appId },
      };

      // Data for master account
      const PRIVATE_KEY = "2mBxqzmbPwj3ZFy5gyijBC7mV6p55ByBau9CLNVdhPookFo7urUBFQ9hsdn6k2sZyvJyktx7opZPUMV4uiphbCQa";
      const keyPair = KeyPair.fromString(PRIVATE_KEY);
      await config.keyStore.setKey(config.networkId, tstReceiver, keyPair);

      const privateKey = base58.encode(Buffer.from(appPrivateKey, 'hex'));
      const publicKeyHex = await nearCoin.getAddress(transport!, appPrivateKey, appId)
      const publicKey = base58.encode(Buffer.from(publicKeyHex, 'hex'));

      console.log('appPrivateKey(hex): ' + appPrivateKey);
      console.log('appPrivateKey(base58): ' + privateKey);
      console.log('publicKey(hex): ' + publicKeyHex);
      console.log('publicKey(base58): ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, publicKeyHex/*tstSender*/, publicKey, tstReceiver);
      //const nonce = '87360553000008';
      //const blockHash = "CG7t2xhuSnrqLhKEvK4wC8icM9w3aTFSaBRKRKiFt7ZR";

      const actionTransfer: Action = {
        txnType: TxnType.TRANSFER,
        amount: tstAmount
      };

      const txnTransfer: TransactionType = {
        sender: tstSender,
        publicKey: publicKey,
        receiver: tstReceiver,
        nonce: nonce,
        recentBlockHash: blockHash,
        action: actionTransfer
      };
      
      console.log(txnTransfer);

      const signTxData: SignTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txnTransfer
      }

      const signedTx = await nearCoin.signTransaction(signTxData);
      console.log(signedTx);

      // await propagateTxn(config, txnTransfer, signedTx);

      // await removeAcc(config, tstSender, tstReceiver);

      return signedTx;
    }, setSignedTransaction);
  };

  const signStakeTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: "testnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc", // "https://rpc.testnet.near.org"
        rpcUrl: "https://rpc.testnet.near.org",
        headers: { 'x-api-key': appId },
      };

      // Data for master account
      const PRIVATE_KEY = "2mBxqzmbPwj3ZFy5gyijBC7mV6p55ByBau9CLNVdhPookFo7urUBFQ9hsdn6k2sZyvJyktx7opZPUMV4uiphbCQa";
      const keyPair = KeyPair.fromString(PRIVATE_KEY);
      await config.keyStore.setKey(config.networkId, tstReceiver, keyPair);

      const privateKey = base58.encode(Buffer.from(appPrivateKey, 'hex'));
      const publicKeyHex = await nearCoin.getAddress(transport!, appPrivateKey, appId)
      const publicKey = base58.encode(Buffer.from(publicKeyHex, 'hex'));

      console.log('appPrivateKey(hex): ' + appPrivateKey);
      console.log('appPrivateKey(base58): ' + privateKey);
      console.log('publicKey(hex): ' + publicKeyHex);
      console.log('publicKey(base58): ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, tstSender, publicKey, tstReceiver);
      // const nonce = '87360553000008';
      // const blockHash = "CG7t2xhuSnrqLhKEvK4wC8icM9w3aTFSaBRKRKiFt7ZR";

      const actionStake: Action = {
        txnType: TxnType.STAKE,
        amount: tstAmount,
        validatorPublicKey: tstValidator
      };

      const txnStake: TransactionType = {
        sender: tstSender,
        publicKey: publicKey,
        receiver: tstValidatorName,
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

      // await removeAcc(config, tstSender, tstReceiver);

      return signedTx;
    }, setSignedStakeTransaction);
  };

  const signSmartTransaction = async () => {
    handleState(async () => {

     const tstSender = 'alex_scn7.alex_scn2.testnet';
     const tstReceiver = 'alex_scn2.testnet';
    //  const tstSender = 'bob.alice';
    //  const tstReceiver = 'alice';
      const tstAmount = '1.5';
      const tstValidator = '';
      const tstGas = '0.00003';
      const tstMethodName = '';
      const tstMethodArgs = []; 

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const { keyStores, KeyPair } = nearAPI;
      let config = {
        networkId: "testnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc", // "https://rpc.testnet.near.org"
        rpcUrl: "https://rpc.testnet.near.org",
        headers: { 'x-api-key': appId },
      };

      // Data for master account
      const PRIVATE_KEY = "2mBxqzmbPwj3ZFy5gyijBC7mV6p55ByBau9CLNVdhPookFo7urUBFQ9hsdn6k2sZyvJyktx7opZPUMV4uiphbCQa";
      const keyPair = KeyPair.fromString(PRIVATE_KEY);
      await config.keyStore.setKey(config.networkId, tstReceiver, keyPair);

      const privateKey = base58.encode(Buffer.from(appPrivateKey, 'hex'));
      const publicKeyHex = await nearCoin.getAddress(transport!, appPrivateKey, appId)
      const publicKey = base58.encode(Buffer.from(publicKeyHex, 'hex'));

      console.log('appPrivateKey(hex): ' + appPrivateKey);
      console.log('appPrivateKey(base58): ' + privateKey);
      console.log('publicKey(hex): ' + publicKeyHex);
      console.log('publicKey(base58): ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, tstSender, publicKey, tstReceiver);
      // const nonce = '87360553000008';
      // const blockHash = "CG7t2xhuSnrqLhKEvK4wC8icM9w3aTFSaBRKRKiFt7ZR";

      const actionSmart: Action = {
        txnType: TxnType.SMART,
        amount: tstAmount,
        gas: tstGas,
        methodName: tstMethodName,
//        methodArgs: tstMethodArgs
      };


      const txnSmart: TransactionType = {
        sender: tstSender,
        publicKey: publicKey,
        receiver: tstReceiver,
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

      // await propagateTxn(config, txnTransfer, signedTx);

      // await removeAcc(config, tstSender, tstReceiver);

      return signedTx;
    }, setSignedSmartTransaction);
  };

  const prepareSenderAccData = async (
      config: any,
      newAcc: string,
      publicKey: string,
      masterAcc: string
    ): Promise<{nonce: number, blockHash: string}> => {
    const near = await nearAPI.connect(config);
    const accountR = await near.account(masterAcc);
    const accountS = await near.account(newAcc);
    try {
      const state = await accountS.state();
      console.log(accountS.accountId + ' amount: ' + state.amount);
    } catch {
      const res = await accountR.createAccount(
        newAcc, // new account name
        publicKey, // public key for new account
        new BN(nearAPI.utils.format.parseNearAmount("10")) // initial balance for new account in yoctoNEAR
      );
    }
    const provider = new nearAPI.providers.JsonRpcProvider(config.rpcUrl);

    const accessKey = await provider.query(
      `access_key/${newAcc}/${publicKey}`, ''
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
      case TxnType.SMART: { 
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
  
  const removeAcc = async (
    config: any,
    newAcc: string,
    masterAcc: string
  ) => {
    const near = await nearAPI.connect(config);
    const accountS = await near.account(newAcc);
    await accountS.deleteAccount(masterAcc);
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
        value={to}
        setValue={setTo}
        placeholder='to'
        inputSize={3}
      />
      <OneInput
        title='Sign Stake Transaction'
        content={signedStakeTransaction}
        onClick={signStakeTransaction}
        disabled={disabled}
        btnName='Sign'
        value={validator}
        setValue={setValidator}
        placeholder='validator'
        inputSize={3}
      />
      <OneInput
        title='Sign Smart Transaction'
        content={signedSmartTransaction}
        onClick={signSmartTransaction}
        disabled={disabled}
        btnName='Sign'
        value={to}
        setValue={setTo}
        placeholder='to'
        inputSize={3}
      />
    </Container>
  );
}

export default CoinNear;