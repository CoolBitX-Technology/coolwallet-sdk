import { useState } from 'react';
import Web3 from 'web3';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import CRONOS from '@coolwallet/cronos';
import { Transaction } from '@coolwallet/cronos/lib/config/types';
import Inputs from '../../Inputs';

const web3 = new Web3('https://evm-cronos.crypto.org');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinCronos(props: Props) {
  const cronos = new CRONOS();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [smartContractTo, setSmartContractTo] = useState('0x81bb32e4A7e4d0500d11A52F3a5F60c9A6Ef126C');
  const [smartContractSignature, setSmartContractSignature] = useState('');
  const [erc20TokenTo, setErc20TokenTo] = useState('0x8A1628c2397F6cA75579A45E81EE3e17DF19720e');
  const [erc20TokenAmount, setErc20TokenAmount] = useState('0.000001');
  const [erc20TokenSingature, setErc20TokenSignature] = useState('');
  const [data, setData] = useState('');
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
      return cronos.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = async () => {
    handleState(async () => {
      const transaction: Transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data })),
        to: to,
        value: web3.utils.toHex(web3.utils.toWei(value.toString(), 'ether')),
        data: data,
      } as Transaction;

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const option = {
        info: { symbol: '', decimals: '' },
      };

      const signTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
        option,
      };

      const signedTx = await cronos.signTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  const signSmartContract = async () => {
    handleState(async () => {
      const transactionData = `0x${data}`;
      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to, data: transactionData })),
        to: smartContractTo,
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
        transport: transport!,
        appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
        option,
      };

      const signedTx = await cronos.signSmartContractTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setSmartContractSignature);
  };

  const signERC20Token = async () => {
    handleState(async () => {
      const scale = 10 ** 6;
      const amount = (+erc20TokenAmount * scale).toString(16);
      const erc20To = erc20TokenTo.startsWith('0x') ? erc20TokenTo.slice(2) : erc20TokenTo;
      const erc20Data = `0xa9059cbb${erc20To.padStart(64, '0')}${amount.padStart(64, '0')}`;
      const USDT_Address = '0x66e428c3f67a68878562e79A0234c1F83c208770';
      let gasLimit;
      try {
        gasLimit = await web3.eth.estimateGas({ from: address, to: USDT_Address, data: erc20Data });
      } catch (e) {
        console.error(e);
        gasLimit = 21000;
      }
      const transaction: Transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(gasLimit),
        to: USDT_Address,
        value: '0x0',
        data: erc20Data,
      } as Transaction;
      console.log(transaction);

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signTxData = {
        transport: transport!,
        appPrivateKey,
        appId,
        transaction: transaction,
        addressIndex: 0,
      };

      const signedTx = await cronos.signTransaction(signTxData);
      console.log('signedTx :', signedTx);

      await web3.eth.sendSignedTransaction(signedTx);

      return signedTx;
    }, setErc20TokenSignature);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get Address' title='Get' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign Transaction'
        title='Sign & Send'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        inputs={[
          {
            value,
            onChange: setValue,
            placeholder: 'value',
          },
          { value: to, onChange: setTo, placeholder: 'to' },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract'
        content={smartContractSignature}
        onClick={signSmartContract}
        disabled={disabled}
        inputs={[
          {
            value: smartContractTo,
            onChange: setSmartContractTo,
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
        btnTitle='Transfer USTD'
        title='Sign ERC 20 Token'
        content={erc20TokenSingature}
        onClick={signERC20Token}
        disabled={disabled}
        inputs={[
          {
            value: erc20TokenTo,
            onChange: setErc20TokenTo,
            placeholder: 'to',
          },
          {
            value: erc20TokenAmount,
            onChange: setErc20TokenAmount,
            placeholder: 'amount',
          },
        ]}
      />
    </Container>
  );
}

export default CoinCronos;