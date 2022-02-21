import { useState } from 'react';
import Web3 from 'web3';
import { Container } from 'react-bootstrap';
import CoinETH from '@coolwallet/eth';
import { Transport } from '@coolwallet/core';
import Inputs from '../../Inputs';
import { useRequest } from '../../../utils/hooks';
import type { FC } from 'react';
import type { EIP1559Transaction, Transaction } from '@coolwallet/eth/lib/config/types';

const web3 = new Web3('https://mainnet.infura.io/v3/03fde1c3db944328aef007132d260202');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const CoinEthPage: FC<Props> = (props: Props) => {
  const coinETH = new CoinETH();
  const disabled = !props.transport || props.isLocked;

  const [address, setAddress] = useState('');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [signature, setSignature] = useState('');
  const [data, setData] = useState('');
  const [eip1559To, setEip1550To] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [eip1559Signature, setEip1559Signature] = useState('');
  const [eip1559Data, setEip1559Data] = useState('');

  const getAddress = () => {
    useRequest(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return coinETH.getAddress(props.transport!, props.appPrivateKey, appId, 0);
    }, props).then(setAddress);
  };

  const signSmartContract = () => {
    useRequest(async () => {
      const transactionData = `0x${data}`;

      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data: transactionData })),
        to,
        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
        data: transactionData,
      } as Transaction;
      console.log(transaction);

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const option = {
        info: { symbol: '', decimals: '' },
      };

      const signTxData = {
        transport: props.transport!,
        appPrivateKey: props.appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
        option,
      };

      const signedTx = await coinETH.signSmartContractTransaction(signTxData);
      console.log('signedTx :', signedTx);

      // await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, props).then(setSignature);
  };

  const signEIP1559SmartContract = () => {
    useRequest(async () => {
      const transactionData = `0x${eip1559Data}`;

      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasTipCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasFeeCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: eip1559To, data: transactionData })),
        to: eip1559To,
        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
        data: transactionData,
      } as EIP1559Transaction;
      console.log(transaction);

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const option = {
        info: { symbol: '', decimals: '' },
      };

      const signTxData = {
        transport: props.transport!,
        appPrivateKey: props.appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
        option,
      };

      const signedTx = await coinETH.signEIP1559Smart(signTxData);
      console.log('signedTx :', signedTx);

      // await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, props).then(setEip1559Signature);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get Address' title='Get' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract'
        content={signature}
        onClick={signSmartContract}
        disabled={disabled}
        inputs={[
          {
            value: to,
            onChange: setTo,
            placeholder: 'to',
          },
          {
            value: data,
            onChange: setData,
            placeholder: 'data arg',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign EIP1559'
        title='Sign EIP1559 Smart Contract'
        content={eip1559Signature}
        onClick={signEIP1559SmartContract}
        disabled={disabled}
        inputs={[
          {
            value: eip1559To,
            onChange: setEip1550To,
            placeholder: 'to',
          },
          {
            value: eip1559Data,
            onChange: setEip1559Data,
            placeholder: 'data arg',
          },
        ]}
      />
    </Container>
  );
};

export default CoinEthPage;
