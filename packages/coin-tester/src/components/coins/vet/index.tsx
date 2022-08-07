import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';

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
  const [signedVIP191TransactionOrigin, setSignedVIP191TransactionOrigin] = useState('');
  const [signedVIP191TransactionDelegator, setSignedVIP191TransactionDelegator] = useState('');
  const [value, setValue] = useState('0.001');
  const [to, setTo] = useState('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed');
  const [delegatorFor, setDelegatorFor] = useState('0x8a02ef4030f5e4602030dfadaf91827c1db31dcf');

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

  const signTransaction = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: web3.utils.toHex(1),
        blockRef: web3.utils.toHex(2864434397),
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
        dependsOn: '0x',
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

      const signedTx = await temp.signTransaction(signTxData);
      return signedTx;
    }, props).then(setSignedTransaction);
  }

    const signVIP191TransactionOrigin = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: web3.utils.toHex(1),
        blockRef: web3.utils.toHex(2864434397),
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
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567c6dd4',
        reserved: {
          features: 1
        }
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

      const signedTx = await temp.signVIP191TransactionOrigin(signTxData);
      return signedTx;
    }, props).then(setSignedVIP191TransactionOrigin);
  }

    const signVIP191TransactionDelegator = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: web3.utils.toHex(1),
        blockRef: web3.utils.toHex(2864434397),
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
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567c6dd4',
        reserved: {
          features: 1
        },
        delegatorFor: '0x22637bce57d2a180656b0b1598984e5da824237e'
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

      const signedTx = await temp.signVIP191TransactionDelegator(signTxData);
      return signedTx;
    }, props).then(setSignedVIP191TransactionDelegator);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
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
        title='Sign VIP191 Transaction Origin (user)'
        content={signedVIP191TransactionOrigin}
        onClick={signVIP191TransactionOrigin}
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
        title='Sign VIP191 Transaction Delegator (sponsor)'
        content={signedVIP191TransactionDelegator}
        onClick={signVIP191TransactionDelegator}
        disabled={disabled}
        btnName='Sign'
        value={delegatorFor}
        setValue={setDelegatorFor}
        placeholder='delegatorFor'
        inputSize={3}
      />
    </Container>
  );
}

export default CoinVet;