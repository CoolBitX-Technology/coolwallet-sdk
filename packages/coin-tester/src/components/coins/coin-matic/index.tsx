import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import Matic from '@coolwallet/coin-matic';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinMatic(props: Props) {
  const matic = new Matic();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

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

  const getAddress = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const address = await matic.getAddress(transport!, appPrivateKey, appId, 0);
      return address;
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction = {
        chainId: 137,
        nonce: '0x289',
        gasPrice: '0x20c855800',
        gasLimit: '0x520c',
        to: to,
        value: '0x38d7ea4c68000', // 0.001
        data: '',
        option: { symbol: '', decimals: '' },
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signedTx = await matic.signTransaction({ transport, appPrivateKey, appId, addressIndex: 0, transaction });
      return signedTx;
    }, setSignedTransaction);
  };

  return (
    <Container>
      <div className="title2">These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title="Get Address" content={address} onClick={getAddress} disabled={disabled} />
      <TwoInputs
        title="Sign Transaction"
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName="Sign"
        value={value}
        setValue={setValue}
        placeholder="value"
        inputSize={1}
        value2={to}
        setValue2={setTo}
        placeholder2="to"
        inputSize2={3}
      />
    </Container>
  );
}

export default CoinMatic;
