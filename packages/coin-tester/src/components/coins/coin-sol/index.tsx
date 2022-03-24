import { Transport } from '@coolwallet/core';
import SOL from '@coolwallet/sol';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import base58 from 'bs58';
import React, { useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';
import Inputs from '../../Inputs';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

function CoinSol(props: Props) {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sol = new SOL();

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

  const [splTokenTransaction, setSplTokenTransaction] = useState({
    token: 'mpRP1iZjbJm3BsTnkLPuamDbnELt6TSmtb5L1KRTUWG',
    to: '28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x',
    amount: '0.1',
    decimals: '9',
    result: '',
  });

  const fromPubkey = useMemo(() => (address ? new PublicKey(address) : null), [address]);

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
      const address = await sol.getAddress(transport!, appPrivateKey, appId);

      return address;
    }, setAddress);
  };

  // for transfer spl-token
  const getAssociatedTokenAddr = async (token: PublicKey, owner: PublicKey) => {
    const [address] = await PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), token.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  };

  const signTransaction = async () => {
    handleState(
      async () => {
        const fromPubkey = address;
        const toPubkey = transaction.to;
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        const tx = { fromPubkey, toPubkey, recentBlockhash, amount: transaction.value };

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
      (result) => setTransaction((prev: any) => ({ ...prev, result }))
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
      (result) => setProgramTransaction((prev: any) => ({ ...prev, result }))
    );
  };

  const signSplTokenTransaction = () =>
    handleState(
      async () => {
        if (fromPubkey === null) throw new Error('please get account first');

        const token = new PublicKey(splTokenTransaction.token);

        const toAccount = new PublicKey(splTokenTransaction.to);

        const fromTokenAccount = await getAssociatedTokenAddr(token, fromPubkey);

        const toTokenAccount = await getAssociatedTokenAddr(token, toAccount);

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          fromPubkey: fromTokenAccount.toBase58(),
          toPubkey: toTokenAccount.toBase58(),
          recentBlockhash,
          options: {
            owner: address,
            decimals: splTokenTransaction.decimals,
            value: splTokenTransaction.amount,
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
        return 'success';

        const send = await connection.sendRawTransaction(recoveredTx.serialize());

        return send;
      },
      (result) => setSplTokenTransaction((prev: any) => ({ ...prev, result }))
    );

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
        setValue={(value) => setTransaction((prev: any) => ({ ...prev, value }))}
        placeholder='value'
        inputSize={1}
        value2={transaction.to}
        setValue2={(to) => setTransaction((prev: any) => ({ ...prev, to }))}
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
        setValue={(data) => setProgramTransaction((prev: any) => ({ ...prev, data }))}
        placeholder='data'
        inputSize={1}
        value2={programTransaction.programId}
        setValue2={(programId) => setProgramTransaction((prev: any) => ({ ...prev, programId }))}
        placeholder2='to'
        inputSize2={3}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign SPL Token'
        content={splTokenTransaction.result}
        onClick={signSplTokenTransaction}
        disabled={disabled}
        inputs={[
          {
            xs: 2,
            value: splTokenTransaction.token,
            onChange: (token: any) =>
              setSplTokenTransaction((prevState: any) => ({
                ...prevState,
                token,
              })),
            placeholder: 'token',
          },
          {
            xs: 2,
            value: splTokenTransaction.to,
            onChange: (to: any) =>
              setSplTokenTransaction((prevState: any) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: splTokenTransaction.amount,
            onChange: (amount: any) =>
              setSplTokenTransaction((prevState: any) => ({
                ...prevState,
                amount,
              })),
            placeholder: 'amount',
          },
          {
            xs: 1,
            value: splTokenTransaction.decimals,
            onChange: (decimals: any) =>
              setSplTokenTransaction((prevState: any) => ({
                ...prevState,
                decimals,
              })),
            placeholder: 'decimals',
          },
        ]}
      />
    </Container>
  );
}

export default CoinSol;
