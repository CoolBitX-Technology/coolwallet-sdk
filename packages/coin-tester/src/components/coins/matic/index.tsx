import { Transport } from '@coolwallet/core';
import Matic from '@coolwallet/matic';
import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import Web3 from 'web3';
import Inputs from '../../Inputs';

const web3 = new Web3('https://matic-mainnet.chainstacklabs.com');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinMatic(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const matic = new Matic();
  
  const [address, setAddress] = useState('0x64797030263Fa2f3be3Fb4d9b7c16FDf11e6d8E1');

  const [ legacy, setLegacy] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF' ,
    value: '0.001', 
    data:'',
    symbol: '',
    decimals: '',
    result: '' 
  })

  const [eip1559, setEip1559] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF' ,
    value: '0.001', 
    data:'',
    symbol: '',
    decimals: '',
    result: '' 
  })

  const [message, setMessage] = useState({
    message: 'matic sign message',
    result: '' 
  })

  const [typedData, setTypedData] = useState({
    typedData: '',
    result: '' 
  })
  

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

  const signLegacy = async () => {
    handleState(async () => {
      const transactionData = `0x${legacy.data}`;
       // const transaction = {
      //   ...
      //   to: to
      //   data: '',
      // }; //coin-matic-normal-tx sample-data

      // const transaction = {
      //   ...
      //   to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
      //   data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
      //   option: { info: { symbol: 'FXT', decimals: '18' } },
      // }; //coin-matic-normal-tx-erc20 sample-data

      // const transaction = {
      //   ...
      //   to: '0x1cE84db0841829E10191E86758A187C026Abb6D7',
      //   data: '0x60fe47b10000000000000000000000000000000000000000000000000000000000000004',
      // }; //coin-matic-normal-tx-sc sample-data

      const transaction = {
        chainId: 137,
        nonce:  web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasTipCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasFeeCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: legacy.to })),
        to: legacy.to,
        value: web3.utils.toHex(web3.utils.toWei(legacy.value, 'ether')), // 0.001
        data: transactionData,
        option: { info: { symbol: legacy.symbol, decimals: legacy.decimals } },
      }; 
      console.log(transaction);


      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signedTx = await matic.signTransaction({ transport, appPrivateKey, appId, addressIndex: 0, transaction }); // sign legacy tx      
      
      return signedTx;
    }, (result) => setLegacy(prevState => ({
      ...prevState,
      result}))
    );
  };

  const signEIP1559 = async () => {
    handleState(async () => { 
      const transactionData = `0x${eip1559.data}`;
      
    //  const transaction = {
    //      ...
    //     to: to,
    //     data: '',
    //   }; //coin-matic-EIP1559-transfer sample-data

      //  const transaction = {
      //   ...
      //   to: '0x1cE84db0841829E10191E86758A187C026Abb6D7',
      //   data: '0x60fe47b10000000000000000000000000000000000000000000000000000000000000004',
      // }; //coin-matic-EIP1559-sc sample-data

    //  const transaction = {
    //     ...
    //     to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
    //     data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
    //     option: { info: { symbol: 'FXT', decimals: '18' } },
    //   }; //coin-matic-EIP1559-erc20 sample-data

      const transaction = {
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasTipCap:  web3.utils.toHex(await web3.eth.getGasPrice()),
        gasFeeCap:  web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit:  web3.utils.toHex(await web3.eth.estimateGas({ to: eip1559.to, data: transactionData })),
        to: eip1559.to,
        value:  web3.utils.toHex(web3.utils.toWei(eip1559.value, 'ether')),
        data: transactionData,
        option: { info: { symbol: eip1559.symbol, decimals: eip1559.decimals } },
      }; 
      console.log(transaction);
      
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signedTx = await matic.signEIP1559Transaction({
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        transaction,
      }); 
  
      return signedTx;
    } , (result) =>  setEip1559(prevState => ({
      ...prevState,
      result}))
    );
  }

  const signMessage = async () => {
    handleState(async () => { 

      const signedTx = await matic.signMessage({
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        message: message.message,
      });
      
      return signedTx;
    } , (result) =>  setMessage(prevState => ({
      ...prevState,
      result}))
    );
  }

  const signTypedData = async () => {
    handleState(async () => { 
      const typedData = {
        types: {
          EIP712Domain: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'version',
              type: 'string',
            },
            {
              name: 'chainId',
              type: 'uint256',
            },
            {
              name: 'verifyingContract',
              type: 'address',
            },
          ],
          ForwardRequest: [
            {
              name: 'from',
              type: 'address',
            },
            {
              name: 'to',
              type: 'address',
            },
            {
              name: 'value',
              type: 'uint256',
            },
            {
              name: 'gas',
              type: 'uint256',
            },
            {
              name: 'nonce',
              type: 'uint256',
            },
            {
              name: 'data',
              type: 'bytes',
            },
          ],
        },
        domain: {
          name: 'TEST',
          version: '0.0.1',
          chainId: 1,
          verifyingContract: '0x3216C8Ac30000d3Ec32Dd648f4Dd0de4f4774579',
        },
        primaryType: 'ForwardRequest',
        message: {
          to: '0x5ED76954e8e271Ea85462Bc23beA0412D8a5AE15',
          from: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
          data: '0x',
          gas: '21000',
          value: '10000000000000000',
          nonce: '6',
        },
        domain: {
          name: 'TEST',
          version: '0.0.1',
          chainId: '8001',
          verifyingContract: '0x3216C8Ac30000d3Ec32Dd648f4Dd0de4f4774579',
        },
        primaryType: 'ForwardRequest',
        message: {
          to: '0x5ED76954e8e271Ea85462Bc23beA0412D8a5AE15',
          from: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF',
          data: '0x',
          gas: '21000',
          value: '10000000000000000',
          nonce: '6',
        },
      }

      const signedTx = await matic.signTypedData({
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        typedData
      });
      
      return signedTx;
    } , (result) =>  setTypedData(prevState => ({
      ...prevState,
      result}))
    );
  }

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
            onChange:  (to) => setLegacy(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: legacy.value,
            onChange:  (value) => setLegacy(prevState => ({
              ...prevState,
              value
            })),
            placeholder: 'value',
          },
          {
            xs: 1, 
            value: legacy.data,
            onChange:  (data) => setLegacy(prevState => ({
              ...prevState,
              data
            })),
            placeholder: 'data arg',
          },
          {
            xs: 1,
            value: legacy.symbol,
            onChange:  (symbol) => setLegacy(prevState => ({
              ...prevState,
              symbol
            })),
            placeholder: 'symbol',
          },
          {
            xs: 1,
            value: legacy.decimals,
            onChange:  (decimals) => setLegacy(prevState => ({
              ...prevState,
              decimals
            })),
            placeholder: 'decimals',
          }
        ]}
      />
      <Inputs
        btnTitle='Sign EIP1559'
        title='Sign EIP1559'
        content={eip1559.result}
        onClick={signEIP1559}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: eip1559.to,
            onChange:  (to) => setEip1559(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: eip1559.value,
            onChange:  (value) => setEip1559(prevState => ({
              ...prevState,
              value
            })),
            placeholder: 'value',
          },
          {
            xs: 1, 
            value: eip1559.data,
            onChange:  (data) => setEip1559(prevState => ({
              ...prevState,
              data
            })),
            placeholder: 'data arg',
          },
          {
            xs: 1,
            value: eip1559.symbol,
            onChange:  (symbol) => setEip1559(prevState => ({
              ...prevState,
              symbol
            })),
            placeholder: 'symbol',
          },
          {
            xs: 1,
            value: eip1559.decimals,
            onChange:  (decimals) => setEip1559(prevState => ({
              ...prevState,
              decimals
            })),
            placeholder: 'decimals',
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
            onChange: (message) =>  setMessage(prevState => ({
              ...prevState,
              message
            })),
            placeholder: 'message',
          }
        ]}
      />
       <Inputs
        btnTitle='Sign'
        title='Sign Typed Data'
        content={typedData.result}
        onClick={signTypedData}
        disabled={disabled}
      />
    </Container>
  );
}

export default CoinMatic;
