import { Transport } from '@coolwallet/core';
import BSC from '@coolwallet/bsc';
import { Transaction } from '@coolwallet/bsc/lib/config/types';
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import Web3 from 'web3';
import Inputs from '../../Inputs';

const web3 = new Web3('https://bsc.mytokenpocket.vip');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinMatic(props: Props) {
  const { appPrivateKey } = props;
  const transport = props.transport as Transport;
  const disabled = !transport || props.isLocked;
  const bsc = new BSC();

  const [address, setAddress] = useState('0x64797030263Fa2f3be3Fb4d9b7c16FDf11e6d8E1');

  const [legacy, setLegacy] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
    value: '0.001',
    result: '',
  });

  const [legacyERC20, setLegacyERC20] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
    value: '0.001',
    symbol: '',
    decimals: '',
    result: '',
  });

  const [legacyData, setLegacyData] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
    data: '',
    value: '',
    result: '',
  });

  const [message, setMessage] = useState({
    message: 'matic sign message',
    result: '',
  });

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
      return bsc.getAddress(transport, appPrivateKey, appId, 0);
    }, setAddress);
  };

  // const transaction = {
  //   ...
  //   to: to
  //   data: '',
  // }; //coin-matic-normal-tx sample-data
  const signLegacy = async () => {
    handleState(
      async () => {
        const transaction = {
          chainId: '137',
          nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
          gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
          gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: legacy.to })),
          to: legacy.to,
          value: web3.utils.toHex(web3.utils.toWei(legacy.value, 'ether')), // 0.001
          data: '',
        };
        console.log(transaction);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        return bsc.signTransaction({ transport, appPrivateKey, appId, addressIndex: 0, transaction }); // sign legacy tx
      },
      (result) =>
        setLegacy((prevState) => ({
          ...prevState,
          result,
        }))
    );
  };

  // const transaction = {
  //   ...
  //   to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
  //   data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
  //   option: { info: { symbol: 'FXT', decimals: '18' } },
  // }; //coin-matic-normal-tx-erc20 sample-data
  const signERC20Token = async () => {
    handleState(
      async () => {
        const scale = 10 ** +legacyERC20.decimals;
        const amount = web3.utils.toHex(Math.floor(+legacyERC20.value * scale)).slice(2);
        const erc20To = legacyERC20.to.startsWith('0x') ? legacyERC20.to.slice(2) : legacyERC20.to;
        const erc20Data = `0xa9059cbb${erc20To.padStart(64, '0')}${amount.padStart(64, '0')}`;
        const contractAddress = '0x66e428c3f67a68878562e79A0234c1F83c208770';

        const transaction = {
          nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
          gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
          gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: contractAddress, data: erc20Data })),
          to: contractAddress,
          value: '0x0',
          data: erc20Data,
          option: {
            info: { symbol: legacyERC20.symbol, decimals: legacyERC20.decimals },
          },
        } as Transaction;
        console.log(transaction);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signTxData = {
          transport,
          appPrivateKey,
          appId,
          transaction,
          addressIndex: 0,
        };

        return bsc.signTransaction(signTxData);
      },
      (result) =>
        setLegacyERC20((prevState) => ({
          ...prevState,
          result,
        }))
    );
  };

  // const transaction = {
  //   ...
  //   to: '0x1cE84db0841829E10191E86758A187C026Abb6D7',
  //   data: '0x60fe47b10000000000000000000000000000000000000000000000000000000000000004',
  // }; //coin-matic-normal-tx-sc sample-data
  const signLegacyData = async () => {
    handleState(
      async () => {
        const transaction = {
          nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
          gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
          gasLimit: web3.utils.toHex(
            await web3.eth.estimateGas({ to: legacyData.to, data: web3.utils.toHex(legacyData.data) })
          ),
          to: legacyData.to,
          value: web3.utils.toHex(web3.utils.toWei(legacyData.value ?? 0, 'ether')), // 0.001
          data: web3.utils.toHex(legacyData.data),
        } as Transaction;
        console.log(transaction);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signTxData = {
          transport,
          appPrivateKey,
          appId,
          transaction,
          addressIndex: 0,
        };

        return bsc.signTransaction(signTxData);
      },
      (result) =>
        setLegacyData((prevState) => ({
          ...prevState,
          result,
        }))
    );
  };

  const signMessage = async () => {
    handleState(
      async () => {
        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signedTx = await bsc.signMessage({
          transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          message: message.message,
        });

        return signedTx;
      },
      (result) =>
        setMessage((prevState) => ({
          ...prevState,
          result,
        }))
    );
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get Address' title='Get' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign'
        title='Sign Legacy'
        content={legacy.result}
        onClick={signLegacy}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: legacy.to,
            onChange: (to) =>
              setLegacy((prevState) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: legacy.value,
            onChange: (value) =>
              setLegacy((prevState) => ({
                ...prevState,
                value,
              })),
            placeholder: 'value',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign ERC20 Token'
        content={legacyERC20.result}
        onClick={signERC20Token}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: legacyERC20.to,
            onChange: (to) =>
              setLegacyERC20((prevState) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: legacyERC20.value,
            onChange: (value) =>
              setLegacyERC20((prevState) => ({
                ...prevState,
                value,
              })),
            placeholder: 'value',
          },
          {
            xs: 1,
            value: legacyERC20.symbol,
            onChange: (symbol) =>
              setLegacyERC20((prevState) => ({
                ...prevState,
                symbol,
              })),
            placeholder: 'symbol',
          },
          {
            xs: 1,
            value: legacyERC20.decimals,
            onChange: (decimals) =>
              setLegacyERC20((prevState) => ({
                ...prevState,
                decimals,
              })),
            placeholder: 'decimals',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract'
        content={legacyData.result}
        onClick={signLegacyData}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: legacyData.to,
            onChange: (to) =>
              setLegacyData((prevState) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: legacyData.value,
            onChange: (value) =>
              setLegacyData((prevState) => ({
                ...prevState,
                value,
              })),
            placeholder: 'value',
          },
          {
            xs: 1,
            value: legacyData.data,
            onChange: (data) =>
              setLegacyData((prevState) => ({
                ...prevState,
                data,
              })),
            placeholder: 'data',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Message'
        content={message.result}
        onClick={signMessage}
        disabled={disabled}
        inputs={[
          {
            value: message.message,
            onChange: (value) =>
              setMessage((prevState) => ({
                ...prevState,
                message: value,
              })),
            placeholder: 'message',
          },
        ]}
      />
    </Container>
  );
}

export default CoinMatic;
