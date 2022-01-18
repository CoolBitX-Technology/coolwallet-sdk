import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import CRO from '@coolwallet/coin-cro';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinCRO(props: Props) {
  const cro = new CRO();
  const [address, setAddress] = useState('');

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

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const address = await cro.getAddress(transport!, appPrivateKey, appId, 0);
      return address;
    }, setAddress);
  };

  // const signTransaction = async () => {
  //   handleState(async () => {
  //     const transaction = {
  //       chainId: 1,
  //       nonce: '0x289',
  //       gasPrice: '0x20c855800',
  //       gasLimit: '0x520c',
  //       to: to,
  //       value: `0x${parseInt(value).toString(16)}`,
  //       data: '',
  //     };

  //     const appId = localStorage.getItem('appId');
  //     if (!appId) throw new Error('No Appid stored, please register!');
  //     const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction);
  //     return signedTx;
  //   }, setSignedTransaction);
  // };

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
      {/* <TwoInputs
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
      /> */}
    </Container>
  );
}

export default CoinCRO;
