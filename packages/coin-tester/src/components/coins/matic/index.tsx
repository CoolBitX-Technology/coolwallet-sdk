import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

import Matic from '@coolwallet/matic';

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
  const [to, setTo] = useState('0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF');

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
      // const transaction = {
      //   chainId: 137,
      //   nonce: '0x08',
      //   gasPrice: '0xEE6B2801',
      //   gasLimit: '0x0493e0',
      //   to: to,
      //   value: '0x38d7ea4c68000', // 0.001
      //   data: '',
      //   option: { info: { symbol: '', decimals: '' } },
      // }; //coin-matic-normal-tx

      // const transaction = {
      //   chainId: 137,
      //   nonce: '0x0c',
      //   gasPrice: '0xEE6B2801',
      //   gasLimit: '0x0493e0',
      //   to: '0x1cE84db0841829E10191E86758A187C026Abb6D7',
      //   value: '0x00', // 0,
      //   data: '0x60fe47b10000000000000000000000000000000000000000000000000000000000000004',
      //   option: { info: { symbol: '', decimals: '' } },
      // }; //coin-matic-normal-tx-sc

      // const transaction = {
      //   chainId: 137,
      //   nonce: '0x0d',
      //   gasPrice: '0xEE6B2801',
      //   gasLimit: '0x0493e0',
      //   to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
      //   value: '0x00', // 0
      //   data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
      //   option: { info: { symbol: 'FXT', decimals: '18' } },
      // }; //coin-matic-normal-tx-erc20

      const transaction = {
        nonce: '0x11',
        gasTipCap: '0x9502F9000',
        gasFeeCap: '0x9502F9000',
        gasLimit: '0x5208',
        to: to,
        value: '0x38d7ea4c68000', // 0.001
        data: '',
        option: { info: { symbol: '', decimals: '' } },
      }; //coin-matic-EIP1559-transfer

      // const transaction = {
      //   nonce: '0x12',
      //   gasTipCap: '0x9502F9000',
      //   gasFeeCap: '0x9502F9000',
      //   gasLimit: '0xF5F4',
      //   to: '0x1cE84db0841829E10191E86758A187C026Abb6D7',
      //   value: '0x00', // 0
      //   data: '0x60fe47b10000000000000000000000000000000000000000000000000000000000000004',
      //   option: { info: { symbol: '', decimals: '' } },
      // }; //coin-matic-EIP1559-sc

      // const transaction = {
      //   nonce: '0x13',
      //   gasTipCap: '0x9502F9000',
      //   gasFeeCap: '0x9502F9000',
      //   gasLimit: '0xF5F4',
      //   to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
      //   value: '0x00', // 0
      //   data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
      //   option: { info: { symbol: 'FXT', decimals: '18' } },
      // }; //coin-matic-EIP1559-erc20

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      // const signedTx = await matic.signTransaction({ transport, appPrivateKey, appId, addressIndex: 0, transaction }); // sign legacy tx

      const signedTx = await matic.signEIP1559Transaction({
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction,
      }); // sign eip1559 tx

      // const signedTx = await matic.signMessage({
      //   transport,
      //   appPrivateKey,
      //   appId,
      //   addressIndex: 0,
      //   message: 'matic sign message',
      // }); // sign message

      // const typedData = {
      //   types: {
      //     EIP712Domain: [
      //       {
      //         name: 'name',
      //         type: 'string',
      //       },
      //       {
      //         name: 'version',
      //         type: 'string',
      //       },
      //       {
      //         name: 'chainId',
      //         type: 'uint256',
      //       },
      //       {
      //         name: 'verifyingContract',
      //         type: 'address',
      //       },
      //     ],
      //     ForwardRequest: [
      //       {
      //         name: 'from',
      //         type: 'address',
      //       },
      //       {
      //         name: 'to',
      //         type: 'address',
      //       },
      //       {
      //         name: 'value',
      //         type: 'uint256',
      //       },
      //       {
      //         name: 'gas',
      //         type: 'uint256',
      //       },
      //       {
      //         name: 'nonce',
      //         type: 'uint256',
      //       },
      //       {
      //         name: 'data',
      //         type: 'bytes',
      //       },
      //     ],
      //   },
      //   domain: {
      //     name: 'TEST',
      //     version: '0.0.1',
      //     chainId: 1,
      //     verifyingContract: '0x3216C8Ac30000d3Ec32Dd648f4Dd0de4f4774579',
      //   },
      //   primaryType: 'ForwardRequest',
      //   message: {
      //     to: '0x5ED76954e8e271Ea85462Bc23beA0412D8a5AE15',
      //     from: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
      //     data: '0x',
      //     gas: '21000',
      //     value: '10000000000000000',
      //     nonce: '6',
      //   },
      //   domain: {
      //     name: 'TEST',
      //     version: '0.0.1',
      //     chainId: '8001',
      //     verifyingContract: '0x3216C8Ac30000d3Ec32Dd648f4Dd0de4f4774579',
      //   },
      //   primaryType: 'ForwardRequest',
      //   message: {
      //     to: '0x5ED76954e8e271Ea85462Bc23beA0412D8a5AE15',
      //     from: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
      //     data: '0x',
      //     gas: '21000',
      //     value: '10000000000000000',
      //     nonce: '6',
      //   },
      // };

      // const signedTX = await matic.signTypedData({
      //   transport,
      //   appPrivateKey,
      //   appId,
      //   typedData,
      //   addressIndex: 0,
      // }); // sign typed data

      return signedTx;
    }, setSignedTransaction);
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
    </Container>
  );
}

export default CoinMatic;
