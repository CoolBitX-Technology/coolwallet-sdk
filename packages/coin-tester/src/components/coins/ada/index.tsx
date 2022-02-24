import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import ADA, { TransferWithoutFee, Options } from '@coolwallet/ada';
import {
  getLatestBlock,
  getAddressInfo,
  getLatestProtocolParameters,
  getUtxos,
  sendTx,
} from './utils/api';
import { NoInput, OneInput, ObjInputs } from '../../../utils/componentMaker';


interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

// const txWithoutFee = {
//   addrIndexes: [0],
//   inputs: [{
//     txId: '0x8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
//     index: 0,
//   }],
//   output: {
//     address: 'addr1qxn5anyxv6dhtl57yvgvpp25emy0pc9wenqzzemxktyr94ahaaap0f0tn4wxaqsydnzty2m0y4gfeu39ckjvsjycs4nssxhc25',
//     amount: 10523059,
//   },
//   change: {
//     address: 'addr1q8wyqhxud34ejxjm5tyj74qeuttr7z9vnjuxy6upyn2w8ryau3fvcuaywgncvz89verfyy24vverl9pw2h5uwv30aq9qm6xj7s',
//     amount: 360000,
//   },
//   ttl: '0x641a5',
// };

function CoinAda(props: Props) {
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;
  const ada = new ADA();

  // 0. Address
  const [addressIndex, setAddressIndex] = useState(0);
  const [address, setAddress] = useState('');

  // 1. On chain data
  const [info, setInfo] = useState('');
  const [block, setBlock] = useState('');
  const [protocolParameters, setProtocolParameters] = useState('');
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [utxos, setUtxos] = useState('');

  // 2. Transfer Tx
  const [transferTxKeys, setTransferTxKeys] = useState([
    'Transaction ID',
    'UTXO Index',
    'To Address',
    'To Amount',
    'Change Address',
    'Change Amount',
    'Time to Live',
  ]);
  const [transferTxValues, setTransferTxValues] = useState([
    '',
    '0',
    '',
    '0',
    '',
    '0',
    '54000000',
  ]);
  const [transferTxSize, setTransferTxSize] = useState(0);
  const [fee, setFee] = useState(0);
  const [verifyingInput, setVerifyingInput] = useState(0);
  const [difference, setDifference] = useState('');
  const [transferTx, setTransferTx] = useState('');
  const [sendTransferTxResult, setSendTransferTxResult] = useState('');

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
      // const address = await ada.getAddress(
      //   transport!,
      //   appPrivateKey,
      //   appId,
      //   addressIndex,
      // );
      const acckey = await ada.getAccountPubKey(transport!, appPrivateKey, appId);
      const address = ada.getAddressByAccountKey(acckey, addressIndex);
      //  to.addressIndex = from.addressIndex == 0 ? 1 : 0;
      //  change.addressIndex = from.addressIndex
      const toIndex = addressIndex === 0 ? 1 : 0;
      const to = ada.getAddressByAccountKey(acckey, toIndex);
      const value = [...transferTxValues];
      value[2] = to;
      value[4] = address;
      setTransferTxValues(value);

      return address;
    }, setAddress);
  };

  const clickToGetAddressInfo = async () => {
    handleState(async () => {
      if (address === '') return 'please getAddress in advance';
      const info = await getAddressInfo(address);
      return JSON.stringify(info);
    }, setInfo);
  };

  const clickToGetLatestBlock = async () => {
    handleState(async () => {
      const latestBlock = await getLatestBlock();
      return JSON.stringify(latestBlock);
    }, setBlock);
  };

  const clickToGetLatestProtocolParameters = async () => {
    handleState(async () => {
      const latestProtocolParameters = await getLatestProtocolParameters();
      setA(latestProtocolParameters.min_fee_a);
      setB(latestProtocolParameters.min_fee_b);
      return JSON.stringify(latestProtocolParameters);
    }, setProtocolParameters);
  };

  const clickToGetUtxos = async () => {
    handleState(async () => {
      if (address === '') return 'please getAddress in advance';
      const utxos = await getUtxos(address);
      return JSON.stringify(utxos);
    }, setUtxos);
  };

  const genTransferTxWithoutFee = () => {
    const [txId, index, address, amount, changeAddress, changeAmount, ttl] = transferTxValues;
    const tx: TransferWithoutFee = {
      addrIndexes: [addressIndex],
      inputs: [{
        txId,
        index,
      }],
      output: {
        address,
        amount,
      },
      ttl,
    };
    if (parseInt(changeAmount) > 0) tx.change = {
      address: changeAddress,
      amount: changeAmount,
    };
    return tx;
  };

  const getTransferTxSize = async () => {
    handleState(async () => {
      const size = await ada.getTransactionSize(genTransferTxWithoutFee());
      return size;
    }, setTransferTxSize);
  };

  const calculateFee = async () => {
    handleState(async () => {
      if (transferTxSize === 0) return 'please getTransferTxSize in advance';
      const fee = a * transferTxSize + b;
      return fee;
    }, setFee);
  };

  const verifyAmount = async () => {
    handleState(async () => {
      if (fee === 0) return 'please calculateFee in advance';
      return `Output + Change should be : ${verifyingInput - fee}`;
    }, setDifference);
  };

  const signTransferTx = async () => {
    handleState(async () => {
      const transaction = {
        fee,
        ...genTransferTxWithoutFee()
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const options = {
        transport: transport!,
        appPrivateKey,
        appId
      };

      const signedTx = await ada.signTransaction(transaction, options);
      return signedTx;
    }, setTransferTx);
  };

  const clickToSendTransferTx = async () => {
    handleState(async () => {
      if (transferTx === '') return 'please sign transfer tx in advance';
      const result = await sendTx(transferTx);
      return result;
    }, setSendTransferTxResult);
  };

  return (
    <Container>
      <div className='title2'>0. Address</div>
      <OneInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
        btnName='Get from SDK'
        value={`${addressIndex}`}
        setNumberValue={setAddressIndex}
        placeholder={'0'}
        inputSize={1}
      />
      <div className='title2'>1. On chain data</div>
      <NoInput
        title='Get Address Info'
        content={info}
        onClick={clickToGetAddressInfo}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Latest Block'
        content={block}
        onClick={clickToGetLatestBlock}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get Latest Protocol Parameters'
        content={protocolParameters}
        onClick={clickToGetLatestProtocolParameters}
        disabled={disabled}
        btnName='Get from API'
      />
      <NoInput
        title='Get UTXOs'
        content={utxos}
        onClick={clickToGetUtxos}
        disabled={disabled}
        btnName='Get from API'
      />
      <div className='title2'>2. Transfer Tx</div>
      <ObjInputs
        title='Transfer Tx Size'
        content={`${transferTxSize} (bytes)`}
        onClick={getTransferTxSize}
        disabled={disabled}
        keys={transferTxKeys}
        values={transferTxValues}
        setValues={setTransferTxValues}
        btnName='Calculate by SDK'
      />
      <OneInput
        title='Calculate Fee'
        content={`${a} (a) * ${transferTxSize} (size) + ${b} (b)`}
        onClick={calculateFee}
        disabled={disabled}
        btnName='Calculate'
        value={`${fee}`}
        setNumberValue={setFee}
        placeholder={'0'}
        inputSize={1}
      />
      <OneInput
        title='Verify Output Value'
        content={difference}
        onClick={verifyAmount}
        disabled={disabled}
        btnName='Calculate'
        value={`${verifyingInput}`}
        setNumberValue={setVerifyingInput}
        placeholder={'0'}
        inputSize={1}
      />
      <NoInput
        title='Sign Transfer Tx'
        content={transferTx}
        onClick={signTransferTx}
        disabled={disabled}
        btnName='Sign by SDK'
      />
      <NoInput
        title='Send Transfer Tx'
        content={sendTransferTxResult}
        onClick={clickToSendTransferTx}
        disabled={disabled}
        btnName='Send'
      />
      <div className='title2'>3. Stake Register Tx (To be continued)</div>
    </Container>
  );
}

export default CoinAda;
