import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import { Transaction } from '@coolwallet/near/lib/config/types';
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

      return near.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      // const transaction = {
      //   chainId: 1,
      //   nonce: '0x289',
      //   gasPrice: '0x20c855800',
      //   gasLimit: '0x520c',
      //   to: to,
      //   value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
      //   data: '',
      // } as Transaction;

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const tstSender = 'alex_scn.testnet';
      const tstReceiver = 'alex_scn2.testnet';
      const tstAmount = '1.5';

      const provider = new nearAPI.providers.JsonRpcProvider("https://rpc.testnet.near.org");

      const appPrivateKey = '4X9hqNchzMzCi3Btjiss5swoMJrDeSorT8zMcqki6oZCCYX79tguTcBSoaLJCzM8YAa9whGZdcCrbzeLKFNffbd4';

      const keyPair = nearAPI.utils.key_pair.KeyPairEd25519.fromString(appPrivateKey);

      const publicKey = keyPair.getPublicKey();

      const accessKey = await provider.query(
        `access_key/${tstSender}/${publicKey.toString()}`, ''
      );

      const nonce = ++accessKey.nonce;

      const txn = {
        sender: tstSender,
        publicKey: publicKey.toString(), 
        receiver: tstReceiver,
        nonce: nonce,
        amount: tstAmount,
        recentBlockHash: accessKey.block_hash
      } as Transaction;

      const signTxData = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        addressIndex: 0,
        transaction: txn
      }


      
      const signedTx = await near.signTransaction(signTxData);

      // const amountNear = nearAPI.utils.format.parseNearAmount(tstAmount);
      // const actions = [nearAPI.transactions.transfer(new BN(amountNear ? amountNear : '0'))];
      // const recentBlockHash = nearAPI.utils.serialize.base_decode(
      //   accessKey.block_hash
      // );
      // const transaction = nearAPI.transactions.createTransaction(
      //   tstSender,
      //   publicKey,
      //   tstReceiver,
      //   nonce,
      //   actions,
      //   recentBlockHash
      // );


      // // 1) serialize the transaction in Borsh
      // const serializedTx = nearAPI.utils.serialize.serialize(
      //   nearAPI.transactions.SCHEMA, 
      //   transaction
      // );
      // // 2) hash the serialized transaction using sha256
      // const serializedTxHash = new Uint8Array(sha256.sha256.array(serializedTx));
      // // 3) create a signature using the hashed transaction
      // const signatureNear = keyPair.sign(serializedTxHash);

      // console.log('signatureNear: ' + Buffer.from(signatureNear.signature).toString('hex'));

      // const signedTransaction = new nearAPI.transactions.SignedTransaction({
      //   transaction,
      //   signature: new nearAPI.transactions.Signature({
      //     keyType: transaction.publicKey.keyType,
      //     data: Buffer.from(signedTx, 'hex'), //signatureNear.signature,
      //   }),
      // });

      // // encodes transaction to serialized Borsh (required for all transactions)
      // const signedSerializedTx = signedTransaction.encode();
      // // sends transaction to NEAR blockchain via JSON RPC call and records the result
      // const result = await provider.sendJsonRpc("broadcast_tx_commit", [
      //   Buffer.from(signedSerializedTx).toString("base64"),
      // ]);

//      const signedTx = await near.signTransaction(transport!, appPrivateKey, appId, 0, transaction);
      return signedTx;

//      return Promise.resolve('yeeear');
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