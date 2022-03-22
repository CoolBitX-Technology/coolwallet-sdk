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

  const [splTokenTransaction, setSplTokenTransaction] = useState({
    token: 'mpRP1iZjbJm3BsTnkLPuamDbnELt6TSmtb5L1KRTUWG',
    to: '28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x',
    amount: '0.1',
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
      const address = await sol.getAddress(transport!, appPrivateKey, appId, 2);

      return address;
    }, setAddress);
  };

  const getTransferTransaction = async () => {
    if (fromPubkey === null) throw new Error('please get account first');

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
    if (fromPubkey === null) throw new Error('please get account first');

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

  // for transfer spl-token
  const getAssociatedTokenAddr = async (token: PublicKey, owner: PublicKey) => {
    const [address] = await PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), token.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  };

  // data encode for transfer
  const dataEncode = (programIdIndex: number | string, amount: number | string) => {
    const programIdToNumber = Number(programIdIndex);
    const isNormalTransfer = programIdToNumber === 2;
    const dataAlloc = isNormalTransfer ? 12 : 9;
    const data = Buffer.alloc(dataAlloc);

    const v2e32 = Math.pow(2, 32);
    const value = Number(amount) * LAMPORTS_PER_SOL;

    const hi32 = Math.floor(value / v2e32);
    const lo32 = value - hi32 * v2e32;

    const programIdIndexSpan = isNormalTransfer ? 4 : 1;

    data.writeUIntLE(programIdToNumber, 0, programIdIndexSpan);
    data.writeUInt32LE(lo32, programIdIndexSpan);
    data.writeInt32LE(hi32, programIdIndexSpan + 4);
    return data;
  };

  const transferSplToken = async (
    fromTokenAccount: PublicKey,
    toTokenAccount: PublicKey,
    amount: number | string,
    programId = TOKEN_PROGRAM_ID
  ) => {
    if (fromPubkey === null) throw new Error('please get account first');
    const data = dataEncode(3, amount);
    const keys = [
      { pubkey: fromTokenAccount, isSigner: false, isWritable: true },
      { pubkey: toTokenAccount, isSigner: false, isWritable: true },
      { pubkey: fromPubkey, isSigner: true, isWritable: false },
    ];
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys,
        programId,
        data,
      })
    );
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.feePayer = fromPubkey;
    return transaction;
  };

  const getSplTransferTransaction = async (): Promise<Transaction> => {
    if (fromPubkey === null) throw new Error('please get account first');

    const token = new PublicKey(splTokenTransaction.token);

    const toAccount = new PublicKey(splTokenTransaction.to);

    const fromTokenAccount = await getAssociatedTokenAddr(token, fromPubkey);

    const toTokenAccount = await getAssociatedTokenAddr(token, toAccount);

    const tx = await transferSplToken(fromTokenAccount, toTokenAccount, splTokenTransaction.amount);

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
        const testscript =
          '03000002C70700000001F5CAA01700CAA11700CAACD70002FFFFCAACD70003FFFFCAAC570004CAAC570024CAAC570044CAAC570064CAAC170084CAAC170085CAAC170086CAACC7008702CAAC170089CAACC7008A04CAAC97008EDC07C003534F4CBAAC5F6C240804DDF09700DAAC97C08E0CD207CC05065052455353425554546F4E';
        const signature = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          message,
          confirmCB: () => {},
          authorizedCB: () => {},
          testscript,
        });

        tx.addSignature(new PublicKey(address), signature);

        const serializeTx = tx.serialize();

        const verifySig = Transaction.from(serializeTx).verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return 'success';

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

  const signSplTokenTransaction = () =>
    handleState(
      async () => {
        const tx = await getSplTransferTransaction();
        console.log('🚀 ~ file: index.tsx ~ line 266 ~ tx', tx.serializeMessage().toString('hex'));
        const message = getMessage(tx);
        console.log(
          '🚀 ~ file: index.tsx ~ line 267 ~ message',
          message.accountKeys.map((key) => key.toString('hex'))
        );

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        // return 'success';
        const testscript =
          '03000202C70700000001F5CAA01700CAA11700CAAC170002CAAC170003CAAC970004DC07C003534F4CD207CC05065052455353425554546F4E';
        const signature = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          message,
          confirmCB: () => {},
          authorizedCB: () => {},
          testscript,
        });
        tx.addSignature(new PublicKey(address), signature);

        const serializeTx = tx.serialize();

        const verifySig = Transaction.from(serializeTx).verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');
        return 'verify success';
        // const send = await connection.sendRawTransaction(serializeTx);

        // return send;
      },
      (result) => setSplTokenTransaction((prev) => ({ ...prev, result }))
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
            onChange: (token) =>
              setSplTokenTransaction((prevState) => ({
                ...prevState,
                token,
              })),
            placeholder: 'token',
          },
          {
            xs: 2,
            value: splTokenTransaction.to,
            onChange: (to) =>
              setSplTokenTransaction((prevState) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
          {
            xs: 1,
            value: splTokenTransaction.amount,
            onChange: (amount) =>
              setSplTokenTransaction((prevState) => ({
                ...prevState,
                amount,
              })),
            placeholder: 'amount',
          },
        ]}
      />
    </Container>
  );
}

export default CoinSol;
