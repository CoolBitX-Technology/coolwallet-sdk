import { Transport } from '@coolwallet/core';
import SOL from '@coolwallet/sol';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
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
    value: '0',
    result: '',
  });

  const [programTransaction, setProgramTransaction] = useState({
    programId: 'BJ1UbRs1usobCHy3Hdd1PWWQ5796xPdvKujTqhDRybri',
    data: '',
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

  const signTransaction = async () => {
    handleState(
      async () => {
        const fromPubkey = address;
        const toPubkey = transaction.to;
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        const tx = { fromPubkey, toPubkey, recentBlockhash, amount: 1 };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
          confirmCB: () => {},
          authorizedCB: () => {},
        });
        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');
        // return 'success';
        const send = await connection.sendRawTransaction(recoveredTx.serialize());

        return send;
      },
      (result) => setTransaction((prev) => ({ ...prev, result }))
    );
  };

  const signSmartContractTransaction = async () => {
    handleState(
      async () => {
        const programId = new PublicKey(programTransaction.programId);

        const SEED = 'hello';
        const greetedPubkey = await PublicKey.createWithSeed(new PublicKey(address), SEED, programId);
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          fromPubkey: greetedPubkey.toBase58(),
          recentBlockhash,
          options: {
            owner: address,
            programId: programTransaction.programId,
            data: programTransaction.data,
          },
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
          confirmCB: () => {},
          authorizedCB: () => {},
        });
        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');
        // return 'success';

        const send = await connection.sendRawTransaction(recoveredTx.serialize());

        return send;
      },
      (result) => setProgramTransaction((prev) => ({ ...prev, result }))
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
      <TwoInputs
        title='Sign Smart Contract Transaction'
        content={programTransaction.result}
        onClick={signSmartContractTransaction}
        disabled={disabled}
        btnName='Sign'
        value={programTransaction.data}
        setValue={(data) => setProgramTransaction((prev) => ({ ...prev, data }))}
        placeholder='data'
        inputSize={1}
        value2={programTransaction.programId}
        setValue2={(programId) => setProgramTransaction((prev) => ({ ...prev, programId }))}
        placeholder2='to'
        inputSize2={3}
      />
    </Container>
  );
}

export default CoinSol;
