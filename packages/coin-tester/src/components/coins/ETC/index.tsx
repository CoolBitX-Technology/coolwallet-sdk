import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';
import ETC from '@coolwallet/ETC';
import axios from 'axios';

// apply for an API key on https://getblock.io for ETC endpoint, it's free for the first 40k requests.
const API_KEY = "";
const API_ENDPOINT = `https://etc.getblock.io/mainnet/?api_key=${API_KEY}`;

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinTemplate(props: Props) {
  const temp = new ETC();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [txSentResult, setTxSentResult] = useState('');
  const [transactionResponse, setTransactionResponse] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');

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
      const address = await temp.getAddress(transport!, appPrivateKey, appId, 0);
      return address;
    }, setAddress);
  };

  const getGasInfo = async () => {
    const response = await axios.post(API_ENDPOINT, {
      "jsonrpc": "2.0",
      "method": "eth_gasPrice",
      "params": [],
      "id": "getblock.io"
    });
    return `${response.data.result}`;
  }

  const traceTx = async () => {
    const response = await axios.post(API_ENDPOINT, {
      "jsonrpc": "2.0",
      "method": "trace_transaction",
      "params": [
        txSentResult
      ],
      "id": "getblock.io"
    });
    console.log({response});
    setTransactionResponse(JSON.stringify(response.data.result));
    return response.data.result;
  }

  const sendRawTx = async () => {
    console.log("sendRawTx", signedTransaction);
    const response = await axios.post(API_ENDPOINT, {
      "jsonrpc": "2.0",
      "method": "eth_sendRawTransaction",
      "params": [
        signedTransaction
      ],
      "id": "getblock.io"
    });
    console.log({response})
    setTxSentResult(response.data.result);
    return response.data;
  }


  const getNonce = async () => {
    console.log("sendRawTx", signedTransaction);
    const response = await axios.post(API_ENDPOINT, {
      "jsonrpc": "2.0",
      "method": "eth_getTransactionCount",
      "params": [
        address,
        "latest"
      ],
      "id": "getblock.io"
    });
    console.log({response})
    const hexString = response.data.result.split('0x')[1];
    const nonce = parseInt(hexString, 16);
    const newNonce = `0x${(nonce).toString(16)}`;
    console.log({newNonce});
    return `${newNonce}`;
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction = {
        chainId: 61,
        nonce: await getNonce(),
        gasPrice: await getGasInfo(),
        gasLimit: '0xcccc',
        to: to,
        value: `0x${parseInt(value).toString(16)}`,
        data: '',
      };

      console.log({transaction})

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction);
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
      <NoInput
        title='Send Transaction'
        btnName='Send'
        content={txSentResult}
        onClick={sendRawTx}
        disabled={(signedTransaction === '')}
      />
      <NoInput
        title='Trace Transaction'
        btnName='Get'
        content={transactionResponse}
        onClick={traceTx}
        disabled={txSentResult === ''}
      />
    </Container>
  );
}

export default CoinTemplate;
