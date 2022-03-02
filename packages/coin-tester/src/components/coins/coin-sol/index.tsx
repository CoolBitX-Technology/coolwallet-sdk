import { Transport } from '@coolwallet/core';
import SOL from '@coolwallet/sol';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import base58 from 'bs58';
import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinSol(props: Props) {
  const sol = new SOL();
  const LAMPORTS_PER_SOL = Math.pow(10, 9);
  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;; 

  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x');

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
      const address = await sol.getAddress(transport!, appPrivateKey, appId, 2);

      return address;
    }, setAddress);
  };

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const signTransaction = async () => {
    handleState(async () => {
      // const transaction: types.txType = {
      //   fromPubkey: '8rzt5i6guiEgcRBgE5x5nmjPL97Ptcw76rnGTyehni7r',
      //   toPubkey: 'D4Bo5ohVx9V7ZpY6xySTTohwBDXNqRXfrDsfP8abNfKJ',
      //   amount: 10,
      //   recentBlockHash,
      //   data: '020000008096980000000000',
      // };

      const transaction = {
        to: to,
        amount: value
      };

      const argument = await getTransferArgument(transaction);
      console.log(argument);
      
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');

      const signedTx = await sol.signTransaction({
        transport: transport as Transport,
        appPrivateKey,
        appId,
        argument
      });
      console.log(signedTx);
      return Buffer.from(signedTx, 'hex').toString('base64');
      // return ""
    }, setSignedTransaction);
  };

  const getTransferArgument = async (transaction: any) => {
    const accExtKey = address;
    const fromPubKey = base58.encode(Buffer.from(accExtKey, "hex"));

    const transfer = SystemProgram.transfer({
      fromPubkey: new PublicKey(fromPubKey),
      toPubkey: new PublicKey(transaction.to),
      lamports: transaction.amount * LAMPORTS_PER_SOL
    });

    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const expectedTransaction = new Transaction({ recentBlockhash }).add(transfer);

    expectedTransaction.feePayer = new PublicKey(fromPubKey);

    const rawTx = expectedTransaction.serialize({ verifySignatures: false }).toString('hex').slice(130);

    return rawTx;
  }

  return (
    // @ts-ignore
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

export default CoinSol;
