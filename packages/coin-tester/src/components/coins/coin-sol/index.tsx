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

  const getProgramTransaction = async () => {
    const fromPubkey = new PublicKey(address);

    const programId = new PublicKey(programTransaction.programId);

    const SEED = 'hello';
    const greetedPubkey = await PublicKey.createWithSeed(fromPubkey, SEED, programId);

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
      programId,
      data: Buffer.from(programTransaction.data, 'hex'),
    });

    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const tx = new Transaction({ recentBlockhash }).add(instruction);

    tx.feePayer = fromPubkey;
    return tx;
  };

  const getMessage = (tx: Transaction) => {
    const { header, accountKeys, instructions } = tx.compileMessage();
    return {
      header,
      accountKeys: accountKeys.map((key: any) => key.toBuffer()),
      recentBlockhash: tx.recentBlockhash as string,
      instructions,
    };
  };

  const signTransaction = async () => {
    handleState(
      async () => {
        const tx = await getTransferTransaction();
        const message = getMessage(tx);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signature = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          message,
          confirmCB: () => {},
          authorizedCB: () => {},
        });
        tx.addSignature(new PublicKey(address), signature);

        const serializeTx = tx.serialize();

        const verifySig = Transaction.from(serializeTx).verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        const send = await connection.sendRawTransaction(serializeTx);

        return send;
      },
      (result) => setTransaction((prev) => ({ ...prev, result }))
    );
  };

  const signSmartContractTransaction = async () => {
    handleState(
      async () => {
        const tx = await getProgramTransaction();
        const message = getMessage(tx);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signature = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          message,
          confirmCB: () => {},
          authorizedCB: () => {},
        });
        tx.addSignature(new PublicKey(address), signature);

        const serializeTx = tx.serialize();

        const verifySig = Transaction.from(serializeTx).verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        const send = await connection.sendRawTransaction(serializeTx);

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
