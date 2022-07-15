import { bech32 } from 'bech32';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import ADA, { TxTypes, RawTransaction } from '@coolwallet/ada';

import { sendTx } from './utils/api';
import { NoInput, OneInput, ObjInputs } from '../../../utils/componentMaker';

interface Props {
  txType: TxTypes,
  txKeys: string[],
  txValues: string[],
  setTxValues: any,
  a: number,
  b: number,
  utxos: string,

  handleState: any,
  options: any,
  disabled: boolean,

  ada: ADA,
  addrIndex: number,
}

function TxField(props: Props) {

  const { txType, txKeys, txValues, setTxValues, a, b, utxos, handleState, options, disabled, ada, addrIndex } = props;

  const [txSize, setTxSize] = useState(0);
  const [estimatedTxSize, setEstimatedTxSize] = useState(0);
  const [fee, setFee] = useState(0);
  const [verifyingInput, setVerifyingInput] = useState(0);
  const [difference, setDifference] = useState(0);
  const [signedTx, setSignedTx] = useState('');
  const [sendTxResult, setSendTxResult] = useState('');

  const genRawTx = () => {
    const [txId, index, changeAddress, changeAmount, ttl] = txValues;

    const tx: RawTransaction = {
      addrIndexes: [addrIndex],
      inputs: [{
        txId,
        index,
      }],
      ttl,
    };

    // // Custom multi-inputs examples
    //
    // const tx: RawTransaction = {
    //   addrIndexes: [0,1],
    //   inputs: [{
    //     txId: 'd2583a077b5e78251154d24573e3b7455bd785d08073ca77c6497d7da421e1f2',
    //     index: '0', // 2980375
    //   }, {
    //     txId: '943dc0b875ef4de46fcfac39995a5d1129dc9da70694d61b407fd860a99c040d',
    //     index: '1', // 999999
    //   }],
    //   ttl,
    // };

    if (parseInt(changeAmount) > 0) tx.change = {
      address: changeAddress,
      amount: changeAmount,
    };

    if (txType === TxTypes.Transfer) {
      const address = txValues[5];
      const amount = parseInt(txValues[6]);
      if (amount > 0) tx.output = { address, amount };
    }
    if (txType === TxTypes.StakeDelegate) {
      const poolId = txValues[5];
      const decoded = bech32.decode(poolId, 80);
      const recovered = bech32.fromWords(decoded.words);
      console.log('recovered :', recovered);
      tx.poolKeyHash = Buffer.from(recovered).toString('hex');
    }
    if (txType === TxTypes.StakeWithdraw) tx.withdrawAmount = txValues[5];

    return tx;
  };

  const getTxSize = () => {
    console.log('getTxSize :');
    handleState(() => {
      if (utxos) {
        const txs = JSON.parse(utxos) as Array<{tx_hash: string, tx_index: number, amount: Array<{quantity: string}>}>;
        const tx = txs.find(e => e.tx_hash === txValues[0]);
        if (tx) {
          const value = [...txValues];
          const amount = tx.amount[0].quantity; 
          setVerifyingInput(Number.parseInt(amount)); 
          value[1] = tx.tx_index.toString(10);

          // modify change by to-amount
          let change = Number.parseInt(value[3]);
          if (!Number.isNaN(change) && txType === TxTypes.Transfer) {
            const output = Number.parseInt(value[6]);
            if (!Number.isNaN(output)) change = difference - output;
            value[3] = change.toString(10);
          }
          setTxValues(value);
        }
      }
      const size = ada.getTransactionSize(genRawTx(), txType);
      setEstimatedTxSize(size);
      return size;
    }, setTxSize);
  };

  const calculateFee = async () => {
    console.log('calculateFee :');
    handleState(async () => {
      // if (txSize === 0) return 'please getTransferTxSize in advance';
      return a * estimatedTxSize + b;
    }, setFee);
  };

  const verifyAmount = async () => {
    console.log('verifyAmount :');
    handleState(async () => {

      // calculate diff by fee and change by to-amount
      const diff = verifyingInput - fee;
      const value = [...txValues];
      let change = diff;
      if (txType === TxTypes.Transfer) {
        const output = Number.parseInt(value[6]);
        if (!Number.isNaN(output)) change = diff - output;
      }
      value[3] = change.toString(10);
      setTxValues(value);
      return diff;
    }, setDifference);
  };

  useEffect(() => {
    getTxSize();
    calculateFee();
    verifyAmount();
  }, [txSize, fee, difference]);

  const signTx = async () => {
    handleState(async () => {
      const transaction = {
        fee,
        ...genRawTx()
      };

      const result = await ada.signTransaction(transaction, options, txType);
      return result;
    }, setSignedTx);
  };

  const sendSignedTx = async () => {
    handleState(async () => {
      if (signedTx === '') return 'please sign tx in advance';
      const result = await sendTx(signedTx);
      return result;
    }, setSendTxResult);
  };
  return (
    <Container>
      <ObjInputs
        title='Tx Size'
        content={`${txSize} (bytes)`}
        onClick={getTxSize}
        disabled={disabled}
        keys={txKeys}
        values={txValues}
        setValues={setTxValues}
        btnName='Calculate by SDK'
      />
      <OneInput
        title='Size to Fee'
        content={`${a} (a) * ${estimatedTxSize} (size) + ${b} (b) = ${fee} (fee)`}
        onClick={calculateFee}
        disabled={disabled}
        btnName='Calculate'
        value={`${estimatedTxSize}`}
        setNumberValue={setEstimatedTxSize}
        placeholder={'0'}
        inputSize={1}
      />
      <OneInput
        title='Input to Output'
        content={`Input - Fee = Output + Change = ${difference}`}
        onClick={verifyAmount}
        disabled={disabled}
        btnName='Calculate'
        value={`${verifyingInput}`}
        setNumberValue={setVerifyingInput}
        placeholder={'0'}
        inputSize={1}
      />
      <NoInput
        title='Sign Tx'
        content={signedTx}
        onClick={signTx}
        disabled={disabled}
        btnName='Sign by SDK'
      />
      <NoInput
        title='Send Tx'
        content={sendTxResult}
        onClick={sendSignedTx}
        disabled={disabled}
        btnName='Send'
      />
    </Container>
  );
}

export default TxField;
