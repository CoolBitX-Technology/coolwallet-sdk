import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import XLM from '@coolwallet/xlm';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import Template from '@coolwallet/template';
// import XLM from '../../../coin-xlm/src';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinTemplate(props: Props) {
  const temp = new Template();
  const xlm = new XLM();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x');

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
      // const address = await temp.getAddress(transport!, appPrivateKey, appId, 0);
      const address = await xlm.getAddress(transport, appPrivateKey, appId)
      return address;
    }, setAddress);
  };

  const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
  const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
  const handleHex = (hex: string) => evenHexDigit(removeHex0x(hex));

  const signTransaction = async () => {
    handleState(async () => {
      const transaction = {
        amount: "0x02000000a086010000000000",
        to: to,
        programId: '0x3131313131313131313131313131313131313131313131313131313131313131',
        data: '',
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const script = '03000202C7070000000091CC07C0022001CAAC570022CC07C0023333CAA0C70016C2ACC700160CCC071099CC07C0028080C3709710DC07C003534F4CBAA0CF6C160E04DDF09700DAACC7C0160C0AD207CC05065052455353425554544F4E'
      
      const argument =
        handleHex(Buffer.from(transaction.to).toString('hex')) +
        handleHex(transaction.amount).padStart(20, "0") +
        handleHex(transaction.programId).padStart(64, "0") 
      
      const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction as any, script, argument);
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

export default CoinTemplate;
