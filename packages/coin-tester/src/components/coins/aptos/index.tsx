import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';

import Aptos from '@coolwallet/aptos';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinAptos(props: Props) {
  const aptos = new Aptos();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [transferTo, setTransferTo] = useState('');

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

      return await aptos.getAuthKey(transport!, appPrivateKey, appId);
    }, setAddress);
  };


  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');
      if (!transferTo) throw new Error('Enter receiver!');

      return '';
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
    </Container>
  );
}

export default CoinAptos;
