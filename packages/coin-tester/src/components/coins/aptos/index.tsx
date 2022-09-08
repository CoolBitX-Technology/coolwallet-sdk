import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import BigNumber from 'bignumber.js';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';
import { transferKeys, transferValues } from './utils/defaultArguments';

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

  // Address
  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('');

  // Transaction
  const [transferArgs, setTransferArgs] = useState(transferValues);
  const [transferPrepare, setTransferPrepare] = useState('');
  const [transferTx, setTransferTx] = useState('');
  const [transferResult, setTransferResult] = useState('');

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

      const sender = await aptos.getAuthKey(transport!, appPrivateKey, appId, addressIndex);
      // const receiver = await aptos.getAuthKey(transport!, appPrivateKey, appId, addressIndex === 0 ? 1 : 0);
      return sender;
    }, setAddress);
  };

  // Transfer Tx

  const prepareTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      // const args = await prepareTx(address, transferArgs, 'transfer', {
      //   amount: new BigNumber(transferArgs[3]).shiftedBy(18).toFixed(),
      //   recipient: transferArgs[4],
      //   payload: Buffer.from(handleHex(transferArgs[5]), 'hex'),
      // });
      // setTransferArgs(args);
      return ''; // `nonce: ${args[0]}, gasLimit: ${args[1]}, gasPrice: ${args[2]}`;
    }, setTransferPrepare);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = { transport: transport!, appPrivateKey, appId };

      const keyIndex = addressIndex;
      const [sender, sequence, receiver, rawAmount, gasLimit, gasPrice, expiration] = transferArgs;
      const amount = new BigNumber(rawAmount).shiftedBy(8).toFixed();
      const transaction = { keyIndex, sender, sequence, receiver, amount, gasLimit, gasPrice, expiration };
      console.log('transaction :', transaction);

      const signedTx = await aptos.signTransaction(transaction, options);
      console.log('signedTx :', signedTx);
      return signedTx;
    }, setTransferTx);
  };

  const sendTransaction = async () => {
    handleState(async () => {
      return '';
    }, setTransferResult);
  };

  return (
    <Container>
      <div className='title2'>
        These two basic methods are required to implement in a coin sdk.
      </div>
      <OneInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
        btnName='Get'
        value={`${addressIndex}`}
        setNumberValue={setAddressIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <div className='title2'>Transfer</div>
      <ObjInputs
        title='Estimate Gas'
        content={transferPrepare}
        onClick={prepareTransaction}
        disabled={disabled}
        keys={transferKeys}
        values={transferArgs}
        setValues={setTransferArgs}
        btnName='Estimate'
      />
      <NoInput
        title='Sign Transaction'
        content={transferTx}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
      />
      <NoInput
        title='Send Transaction'
        content={transferResult}
        onClick={sendTransaction}
        disabled={disabled}
        btnName='Send'
      />
    </Container>
  );
}

export default CoinAptos;
