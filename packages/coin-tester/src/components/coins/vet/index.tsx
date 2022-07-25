import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import VET from '@coolwallet/vet'
import { useRequest } from '../../../utils/hooks';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinVet(props: Props) {
  const temp = new VET();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [signedTransaction2, setSignedTransaction2] = useState('');
  const [value, setValue] = useState('2');
  const [to, setTo] = useState('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed');

  const { appPrivateKey } = props;
  const transport = props.transport;
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
      return await temp.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction = {
        chainTag: 1,
        blockRef: '0x00000000aabbccdd',
        expiration: 32,
        clauses: [{
            to: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
            value: 10000,
            data: '0x000000606060'
        }],
        gasPriceCoef: 128,
        gas: 21000,
        dependsOn: null,
        nonce: "0xf2ed7cd2567c6dd4",
      }
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId: "",
        addressIndex: 0,
      }

      const appId = localStorage.getItem('appId');
      // const appId = "";
      if (!appId) throw new Error('No Appid stored, please register!');
      signTxData.appId = appId;
      console.log("signning transaction...");
      const signedTx = await temp.signTransaction(signTxData);
      console.log("signining done....")
      return signedTx;
    }, setSignedTransaction);
  };

  const signTransaction2 = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: '0x0001',
        blockRef: '0x00000000aabbccdd',
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
            value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
            data: '0x000000606060',
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(21000),
        dependsOn: null,
        nonce: '0xf2ed7cd2567c6dd4',
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      }
      console.log("signTxData: ", {signTxData});

      console.log("signning transaction2...", transaction.clauses[0].value);
      const signedTx = await temp.signTransaction2(signTxData);
      console.log("signining2 done....")
      return signedTx;
    }, props).then(setSignedTransaction2);
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
      <TwoInputs
        title='Sign Transaction without reserved'
        content={signedTransaction2}
        onClick={signTransaction2}
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

export default CoinVet;