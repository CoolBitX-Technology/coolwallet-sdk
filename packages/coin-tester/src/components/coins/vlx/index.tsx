import { useState } from 'react';
import Web3 from 'web3';
import { Container } from 'react-bootstrap';
import CoinVelas from '@coolwallet/vlx';
import { Transport } from '@coolwallet/core';
import Inputs from '../../Inputs';
import { useRequest } from '../../../utils/hooks';
import type { FC } from 'react';
import type { EIP1559Transaction, Transaction } from '@coolwallet/vlx/lib/config/types';
import { getTransferArgument } from '@coolwallet/vlx/lib/utils/scriptUtils';

const web3 = new Web3('https://evmexplorer.velas.com/rpc');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const CoinEthPage: FC<Props> = (props: Props) => {
  const coinVelas = new CoinVelas();
  const disabled = !props.transport || props.isLocked;

  const [address, setAddress] = useState('');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [signature, setSignature] = useState('');
  const [data, setData] = useState('');

  const [transferTo, setTransferTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [transferSignature, setTransferSignature] = useState('');
  const [transferData, setTransferData] = useState('');

  const getAddress = () => {
    useRequest(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return coinVelas.getAddress(props.transport!, props.appPrivateKey, appId, 0);
    }, props).then(setAddress);
  };

  const signTransfer = () => {
    useRequest(async () => {
      const transactionData = `0x${transferData}`;

      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: transferTo, data: transactionData })),
        to: transferTo,
        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
        data: transactionData,
        chainId: 106
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

      const signedTx = await coinVelas.signTransferTransaction(signTxData);
      console.log('signedTx :', signedTx);

      // await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, props).then(setTransferSignature);
  }

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
        chainId: 106
      } as Transaction;
      console.log(transaction);

      console.log(await getTransferArgument(transaction, 0))


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

      const signedTx = await coinVelas.signSmartContractTransaction(signTxData);
      console.log('signedTx :', signedTx);

      // await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, props).then(setSignature);
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
        btnTitle='Sign'
        title='Sign Transfer'
        content={transferSignature}
        onClick={signTransfer}
        disabled={disabled}
        inputs={[
          {
            value: transferTo,
            onChange: setTransferTo,
            placeholder: 'to',
          },
          {
            value: transferData,
            onChange: setTransferData,
            placeholder: 'data arg',
          },
        ]}
      />
    </Container>
  );
};

export default CoinEthPage;
