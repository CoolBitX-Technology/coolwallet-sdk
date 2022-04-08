import { useState } from 'react';
import { Transport } from '@coolwallet/core';
import SOL, { TransactionCreator } from '@coolwallet/sol';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Container } from 'react-bootstrap';
import Inputs from '../../Inputs';
import * as borsh from 'borsh';

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

  const [account, setAccount] = useState('');

  const [transaction, setTransaction] = useState({
    to: '28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x',
    value: '0.1',
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
  const [associateAccTx, setAssociateAccTx] = useState({
    token: 'mpRP1iZjbJm3BsTnkLPuamDbnELt6TSmtb5L1KRTUWG',
    owner: '28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x',
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

  const getAddress = () => {
    handleState(() => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return sol.getAddress(transport!, appPrivateKey, appId);
    }, setAccount);
  };

  // for transfer spl-token
  const getAssociatedTokenAddr = async (token: PublicKey, owner: PublicKey): Promise<PublicKey> => {
    const [address] = await PublicKey.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), token.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  };

  // for smart contract
  const getOrCreateSmcAssociateAccount = async (owner: string, seed: string, programId: string): Promise<PublicKey> => {
    const programIdToPK = new PublicKey(programId);
    const address = await PublicKey.createWithSeed(new PublicKey(owner), seed, programIdToPK);
    const accountData = await connection.getAccountInfo(new PublicKey(address));

    if (accountData) {
      return address;
    }

    class GreetingAccount {
      counter = 0;
      constructor(fields?: any) {
        if (fields) {
          this.counter = fields.counter;
        }
      }
    }

    const GreetingSchema = new Map([[GreetingAccount, { kind: 'struct', fields: [['counter', 'u32']] }]]);

    const GREETING_SIZE = borsh.serialize(GreetingSchema, new GreetingAccount()).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);
    const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    const tx = TransactionCreator.createAccountWithSeed(
      account,
      address.toString(),
      account,
      seed,
      lamports,
      GREETING_SIZE,
      programIdToPK.toString(),
      recentBlockhash
    );
    const appId = localStorage.getItem('appId');
    if (!appId) throw new Error('No Appid stored, please register!');
    try {
      const signedTx = await sol.signTransaction({
        transport: transport as Transport,
        appPrivateKey,
        appId,
        transaction: tx,
      });
      const recoveredTx = Transaction.from(signedTx);

      const verifySig = recoveredTx.verifySignatures();

      // signature need to be valid
      if (!verifySig) throw new Error('Fail to verify signature');

      await connection.sendRawTransaction(recoveredTx.serialize());
    } catch (error) {
      console.log(error);
    } finally {
      return address;
    }
  };

  const signTransaction = async () => {
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const fromPubkey = account;
        const toPubkey = transaction.to;
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = TransactionCreator.transfer(fromPubkey, toPubkey, recentBlockhash, transaction.value);

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
        });
        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');
        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setTransaction((prev: any) => ({ ...prev, result }))
    );
  };

  const signSmartContractTransaction = async () => {
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');
        const SEED = 'hello';

        const greetedPubkey = await getOrCreateSmcAssociateAccount(account, SEED, programTransaction.programId);

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          instructions: [
            {
              accounts: [{ pubkey: greetedPubkey.toBase58(), isSigner: false, isWritable: true }],
              programId: programTransaction.programId,
              data: programTransaction.data,
            },
          ],
          recentBlockhash,
          feePayer: account,
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setProgramTransaction((prev: any) => ({ ...prev, result }))
    );
  };

  const signSplTokenTransaction = () =>
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const token = new PublicKey(splTokenTransaction.token);

        const fromPubkey = new PublicKey(account);

        const toAccount = new PublicKey(splTokenTransaction.to);

        const fromTokenAccount = await getAssociatedTokenAddr(token, fromPubkey);

        const toTokenAccount = await getAssociatedTokenAddr(token, toAccount);

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = TransactionCreator.transferSplToken(
          account,
          fromTokenAccount.toString(),
          toTokenAccount.toString(),
          recentBlockhash,
          splTokenTransaction.amount,
          splTokenTransaction.decimals
        );

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setSplTokenTransaction((prev: any) => ({ ...prev, result }))
    );

  const signCreateAssociateAccount = async () => {
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const token = new PublicKey(associateAccTx.token);
        const owner = new PublicKey(associateAccTx.owner);
        const associateAccount = await getAssociatedTokenAddr(token, owner);

        const accountData = await connection.getAccountInfo(new PublicKey(associateAccount));

        if (accountData) {
          if (accountData.data.length > 0) {
            const tokenExt = Buffer.from(accountData.data.slice(0, 32));
            const ownerExt = Buffer.from(accountData.data.slice(32, 64));
            if (tokenExt.equals(token.toBuffer()) && ownerExt.equals(owner.toBuffer()))
              throw new Error('User already have associate account');
            throw new Error('Fail to get Associate account: account owner or token is incorrect');
          }
          throw new Error('Fail to get Associate account: account data empty');
        }

        const tx = TransactionCreator.createAssociateAccount(
          account,
          owner.toString(),
          associateAccount.toString(),
          token.toString(),
          (await connection.getRecentBlockhash()).blockhash
        );

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(signedTx);

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setAssociateAccTx((prev: any) => ({ ...prev, result }))
    );
  };
  return (
    // @ts-ignore
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get' title='Get Address' content={account} onClick={getAddress} disabled={disabled} />
      <Inputs
        btnTitle='Sign'
        title='Sign Transaction'
        content={transaction.result}
        onClick={signTransaction}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: transaction.value,
            onChange: (value: any) =>
              setTransaction((prevState: any) => ({
                ...prevState,
                value,
              })),
            placeholder: 'amount',
          },
          {
            xs: 2,
            value: transaction.to,
            onChange: (to: any) =>
              setTransaction((prevState: any) => ({
                ...prevState,
                to,
              })),
            placeholder: 'to',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Sign Smart Contract Transaction'
        content={programTransaction.result}
        onClick={signSmartContractTransaction}
        disabled={disabled}
        inputs={[
          {
            xs: 2,
            value: programTransaction.data,
            onChange: (data: any) =>
              setProgramTransaction((prevState: any) => ({
                ...prevState,
                data,
              })),
            placeholder: 'data',
          },
          {
            xs: 2,
            value: programTransaction.programId,
            onChange: (programId: any) =>
              setProgramTransaction((prevState: any) => ({
                ...prevState,
                programId,
              })),
            placeholder: 'programId',
          },
        ]}
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
      <Inputs
        btnTitle='Sign'
        title='Get Associate Account'
        content={associateAccTx.result}
        onClick={signCreateAssociateAccount}
        disabled={disabled}
        inputs={[
          {
            xs: 2,
            value: associateAccTx.token,
            onChange: (token: any) =>
              setAssociateAccTx((prevState: any) => ({
                ...prevState,
                token,
              })),
            placeholder: 'token',
          },
          {
            xs: 2,
            value: associateAccTx.owner,
            onChange: (owner: any) =>
              setAssociateAccTx((prevState: any) => ({
                ...prevState,
                owner,
              })),
            placeholder: 'owner',
          },
        ]}
      />
    </Container>
  );
}

export default CoinSol;
