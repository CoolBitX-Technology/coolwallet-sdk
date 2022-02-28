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
  const matic = new Matic();
  const [address, setAddress] = useState('0x64797030263Fa2f3be3Fb4d9b7c16FDf11e6d8E1');

  const [signTransition, setSignTransition] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF' ,
    value: '0.001', 
    result: '' 
  })

  const [smartContract, setSmartContract] = useState({
    to: '0xCc4949373fBDf5CB53c1d4b9DdF59F46d40bDfFF' ,
    value: '0', 
    data:'',
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

  const [erc20, setErc20] = useState({
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
  
  const { transport, appPrivateKey } = props;
  // const disabled = !transport || props.isLocked;
  const disabled = false;

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

  const onSignTransaction = async () => {
    handleState(async () => {

      // const transaction = {
      //   nonce: '0x11',
      //   gasTipCap: '0x9502F9000',
      //   gasFeeCap: '0x9502F9000',
      //   gasLimit: '0x5208',
      //   to: to,
      //   value: '0x38d7ea4c68000', // 0.001
      //   data: '',
      //   option: { info: { symbol: '', decimals: '' } },
      // }; //coin-matic-EIP1559-transfer

      const transaction = {
        nonce:  web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasTipCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasFeeCap: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: signTransition.to })),
        to: signTransition.to,
        value: web3.utils.toHex(web3.utils.toWei(signTransition.value, 'ether')), // 0.001
        data: '',
        option: { info: { symbol: '', decimals: '' } },
      }; //coin-matic-EIP1559-transfer
      console.log(transaction);


      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signedTx = await matic.signTransaction({ transport, appPrivateKey, appId, addressIndex: 0, transaction }); // sign legacy tx      
      
      return signedTx;
    }, (result) =>  setSignTransition(prevState => ({
      ...prevState,
      result}))
    );
  };

  const signSmartContract = async () => {
    handleState(async () => { 
      const transactionData = `0x${smartContract.data}`;
   
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

      const transaction = {
        chainId: 137,
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit:  web3.utils.toHex(await web3.eth.estimateGas({ to: smartContract.to, data: transactionData })),
        to: smartContract.to,
        value: web3.utils.toHex(web3.utils.toWei(smartContract.value, 'ether')),
        data: transactionData,
        option: { info: { symbol: '', decimals: '' } },
      };
      console.log(transaction);

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signedTX = await matic.signSmartContractTransaction({
          transport,
          appPrivateKey,
          appId,
          typedData,
          addressIndex: 0,
      });

      return signedTx;
    } , (result) =>  setSmartContract(prevState => ({
      ...prevState,
      result}))
    );
  }

  const signEIP1559SmartContract = async () => {
    handleState(async () => { 
      const transactionData = `0x${eip1559.data}`;
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

      if(eip1559.symbol && eip1559.decimals ) {
         const signedTx = await matic.signEIP1559ERC20({
          transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction,
        }); 
      } else {
        const signedTx = await matic.signEIP1559Smart({
          transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction,
        }); 
      }

      return signedTx;
    } , (result) =>  setEip1559(prevState => ({
      ...prevState,
      result}))
    );
  }

  const signERC2O = async () => {
    handleState(async () => { 
      const transactionData = `0x${erc20.data}`;
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
      //   nonce: '0x0d',
      //   gasPrice: '0xEE6B2801',
      //   gasLimit: '0x0493e0',
      //   to: '0xdd0Db7aA1E23E38AaEf1FC3A5b7CF32c8574b414',
      //   value: '0x00', // 0
      //   data: '0xa9059cbb000000000000000000000000cc4949373fbdf5cb53c1d4b9ddf59f46d40bdfff000000000000000000000000000000000000000000000000002386f26fc10000',
      //   option: { info: { symbol: 'FXT', decimals: '18' } },
      // }; //coin-matic-normal-tx-erc20

      const transaction = {
        chainId: 137,
        nonce: web3.utils.toHex(await web3.eth.getTransactionCount(address, 'pending')),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(await web3.eth.estimateGas({ to: erc20.to, data: transactionData })),
        to: erc20.to,
        value: web3.utils.toHex(web3.utils.toWei(erc20.value, 'ether')),
        data: transactionData,
        option: { info: { symbol: erc20.symbol, decimals: erc20.decimals } },
      }; 
      console.log(transaction);

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      if(erc20.symbol && erc20.decimals && erc20.data ) {
         const signedTx = await matic.signERC20Transaction({
          transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction,
        }); 
      } else {
        const signedTx = await matic.signTransaction({
          transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction,
        }); 
      }

      return signedTx;
    } , (result) =>  setErc20(prevState => ({
      ...prevState,
      result}))
    );
  }

  const signMessage = async () => {
    handleState(async () => { 
      // const signedTx = await matic.signMessage({
      //   transport,
      //   appPrivateKey,
      //   appId,
      //   addressIndex: 0,
      //   message: 'matic sign message',
      // }); // sign message

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
      // }

      // const signedTX = await matic.signTypedData({
      //   transport,
      //   appPrivateKey,
      //   appId,
      //   typedData,
      //   addressIndex: 0,
      // }); // sign typed data

      const signedTx = await matic.signTypedData({
        transport,
        appPrivateKey,
        appId,
        addressIndex: 0,
        typedData: typedData.typedData,
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
        title='Sign Transaction'
        content={signTransition.result}
        onClick={onSignTransaction}
        disabled={disabled}
        inputs={[
          {
            value: signTransition.to,
            onChange: (to) =>  setSignTransition(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            value: signTransition.value,
            onChange: (value) =>  setSignTransition(prevState => ({
              ...prevState,
              value
            })),
            placeholder: 'value',
          }
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract'
        content={smartContract.result}
        onClick={signSmartContract}
        disabled={disabled}
        inputs={[
          {
            value: smartContract.to,
            onChange:  (to) =>  setSmartContract(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            value: smartContract.data,
            onChange:  (data) =>  setSmartContract(prevState => ({
              ...prevState,
              data
            })),
            placeholder: 'data arg',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign EIP1559'
        title='Sign EIP1559 Smart Contract'
        content={eip1559.result}
        onClick={signEIP1559SmartContract}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: eip1559.to,
            onChange:  (to) =>  setEip1559(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            xs: 1, 
            value: eip1559.data,
            onChange:  (data) =>  setEip1559(prevState => ({
              ...prevState,
              data
            })),
            placeholder: 'data arg',
          },
          {
            xs: 1,
            value: eip1559.symbol,
            onChange:  (symbol) =>  setEip1559(prevState => ({
              ...prevState,
              symbol
            })),
            placeholder: 'symbol',
          },
          {
            xs: 1,
            value: eip1559.decimals,
            onChange:  (decimals) =>  setEip1559(prevState => ({
              ...prevState,
              decimals
            })),
            placeholder: 'decimals',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign ERC20'
        title='Sign ERC20'
        content={erc20.result}
        onClick={signERC2O}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: erc20.to,
            onChange:  (to) =>  setErc20(prevState => ({
              ...prevState,
              to
            })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: erc20.data,
            onChange:  (data) =>  setErc20(prevState => ({
              ...prevState,
              data
            })),
            placeholder: 'data arg',
          },
          {
            xs: 1,
            value: erc20.symbol,
            onChange:  (symbol) =>  setErc20(prevState => ({
              ...prevState,
              symbol
            })),
            placeholder: 'symbol',
          },
          {
            xs: 1,
            value: erc20.decimals,
            onChange:  (decimals) =>  setErc20(prevState => ({
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
        inputs={[
          {
            value: typedData.typedData,
            onChange: (typedData) =>  setTypedData(prevState => ({
              ...prevState,
              typedData
            })),
            placeholder: 'typed Data',
          }
        ]}
      />
    </Container>
  );
}

export default CoinMatic;
