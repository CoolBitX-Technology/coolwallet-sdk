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
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sol = new SOL();
  const LAMPORTS_PER_SOL = Math.pow(10, 9);

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const [address, setAddress] = useState('');

  const [transaction, setTransaction] = useState({
    to: '28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x',
    value: 0,
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
      const address = await sol.getAddress(transport!, appPrivateKey, appId, 2);

      return address;
    }, setAddress);
  };

  const getTransferTransaction = async () => {
    const fromPubkey = new PublicKey(address);

    const transfer = SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(transaction.to),
      lamports: Number(transaction.value) * LAMPORTS_PER_SOL,
    });

    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const tx = new Transaction({ recentBlockhash }).add(transfer);

    tx.feePayer = fromPubkey;
    return tx;
  };
  const getMessage = (tx: Transaction) => {
    const { header, accountKeys, instructions } = tx.compileMessage();
    return {
      header,
      accountKeys: accountKeys.map((key) => key.toBuffer()),
      recentBlockhash: tx.recentBlockhash,
      instructions,
    };
  };
  const signTransaction = async () => {
    handleState(
      async () => {
        // const transaction: types.txType = {
        //   fromPubkey: '8rzt5i6guiEgcRBgE5x5nmjPL97Ptcw76rnGTyehni7r',
        //   toPubkey: 'D4Bo5ohVx9V7ZpY6xySTTohwBDXNqRXfrDsfP8abNfKJ',
        //   amount: 10,
        //   recentBlockHash,
        //   data: '020000008096980000000000',
        // };
        const transaction = await getTransferTransaction();
        const message = getMessage(transaction);
        console.log('🚀 ~ file: index.tsx ~ line 91 ~ transaction', transaction);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          message,
        });

        return signedTx;
      },
      (result) => setTransaction((prev) => ({ ...prev, result }))
    );
  };

  return (
    // @ts-ignore
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      <TwoInputs
        title='Sign Transaction'
        content={transaction.result}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
        value={transaction.value}
        setValue={(value) => setTransaction((prev) => ({ ...prev, value }))}
        placeholder='value'
        inputSize={1}
        value2={transaction.to}
        setValue2={(to) => setTransaction((prev) => ({ ...prev, to }))}
        placeholder2='to'
        inputSize2={3}
      />
    </Container>
  );
}

export default CoinSol;
