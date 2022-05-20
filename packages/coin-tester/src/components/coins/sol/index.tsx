import { useState } from 'react';
import { Transport } from '@coolwallet/core';
import SOL, { LAMPORTS_PER_SOL, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@coolwallet/sol';
import { Connection, PublicKey, StakeProgram, Transaction } from '@solana/web3.js';
import { Container } from 'react-bootstrap';
import Inputs from '../../Inputs';

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

function CoinSol(props: Props) {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const sol = new SOL();

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const [account, setAccount] = useState('');

  const [transaction, setTransaction] = useState({
    to: 'Dwp73u5vcXz2BhqtjrQWvztJGNhgyhE6oqM2tH6BRup2',
    value: '0.000001',
    result: '',
  });

  const [splTokenTransaction, setSplTokenTransaction] = useState({
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    to: 'Dwp73u5vcXz2BhqtjrQWvztJGNhgyhE6oqM2tH6BRup2',
    amount: '0.000001',
    decimals: '6',
    result: '',
  });

  const [associateAccTx, setAssociateAccTx] = useState({
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    owner: 'Dwp73u5vcXz2BhqtjrQWvztJGNhgyhE6oqM2tH6BRup2',
    result: '',
  });

  const [undelegate, setUndelegate] = useState({
    seed: 'stake:0',
    result: '',
  });

  const [delegateAndCreateAccountWithSeed, setDelegateAndCreateAccountWithSeed] = useState({
    seed: 'stake:0',
    vote: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
    amount: '0.003',
    result: '',
  });

  const [stakingWithdraw, setStakingWithdraw] = useState({
    value: '0',
    seed: 'stake:0',
    toPubkey: 'AnJZ8PLH3YZVJRifPb2jLXDwaKXtScHrQmpCiQ3vS8jm',
    result: '',
  });

  const [txString, setTxString] = useState('');

  const [txResult, setTxResult] = useState('');

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
      return sol.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAccount);
  };

  // for transfer spl-token
  const getAssociatedTokenAddr = async (token: PublicKey, owner: PublicKey): Promise<PublicKey> => {
    const [address] = await sol.findProgramAddress(
      [owner.toBuffer(), TOKEN_PROGRAM_ID, token.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return new PublicKey(address);
  };

  // for transfer spl-token
  const checkAssociateTokenAccountValid = async (
    associatedAccount: PublicKey,
    token: PublicKey,
    owner: PublicKey
  ): Promise<boolean> => {
    const accountData = await connection.getAccountInfo(associatedAccount);

    if (accountData) {
      if (accountData.data.length > 0) {
        const tokenExt = Buffer.from(accountData.data.slice(0, 32));
        const ownerExt = Buffer.from(accountData.data.slice(32, 64));
        if (tokenExt.equals(token.toBuffer()) && ownerExt.equals(owner.toBuffer())) {
          return true;
        }
        throw new Error('Fail to get Associate account: account owner or token is incorrect');
      }
      throw new Error('Fail to get Associate account: account data empty');
    }
    throw new Error(`Need to create associate token account for account ${owner}`);
  };

  const signTransaction = async () => {
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const toPubkey = transaction.to;
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction: {
            toPubkey,
            recentBlockhash,
            lamports: +transaction.value * LAMPORTS_PER_SOL,
          },
        });
        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
      },
      (result) => setTransaction((prev: any) => ({ ...prev, result }))
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
        await checkAssociateTokenAccountValid(fromTokenAccount, token, fromPubkey);
        const toTokenAccount = await getAssociatedTokenAddr(token, toAccount);
        await checkAssociateTokenAccountValid(toTokenAccount, token, toAccount);

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tokenInfo = {
          symbol: 'LDK',
          address: token.toString(),
          decimals: splTokenTransaction.decimals,
        };

        const tx = {
          account,
          fromTokenAccount: fromTokenAccount.toString(),
          toTokenAccount: toTokenAccount.toString(),
          recentBlockhash,
          amount: +splTokenTransaction.amount * (10 ** +splTokenTransaction.decimals),
          tokenInfo,
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
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

        // check if associateAccount was not created
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

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          owner: owner.toString(),
          associateAccount: associateAccount.toString(),
          token: token.toString(),
          recentBlockhash,
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          addressIndex: 0,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
      },
      (result) => setAssociateAccTx((prev: any) => ({ ...prev, result }))
    );
  };

  const signUndelegate = () =>
    handleState(
      async () => {
        const stakePubkey = await sol.createWithSeed(account, undelegate.seed, StakeProgram.programId.toString());
        // check if associateAccount was not created
        const accountData = await connection.getAccountInfo(new PublicKey(stakePubkey));
        if (!accountData) {
          throw new Error('Fail to get Associate account: account data empty');
        }

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          stakePubkey: stakePubkey.toString(),
          authorizedPubkey: account,
          recentBlockhash,
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signUndelegate({
          transport: transport as Transport,
          appPrivateKey,
          addressIndex: 0,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
      },
      (result) => setUndelegate((prev: any) => ({ ...prev, result }))
    );

  const signDelegateAndCreateAccountWithSeed = () =>
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const stakePubkey = await sol.createWithSeed(
          account,
          delegateAndCreateAccountWithSeed.seed,
          StakeProgram.programId.toString()
        );

        // check if associateAccount was not created
        const accountData = await connection.getAccountInfo(new PublicKey(stakePubkey));
        if (accountData) {
          if (accountData.data.length > 0) {
            console.log(accountData);
            throw new Error('User already have associate account');
          }
          throw new Error('Fail to get Associate account: account data empty');
        }

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const tx = {
          newAccountPubkey: stakePubkey.toString(),
          basePubkey: account,
          votePubkey: delegateAndCreateAccountWithSeed.vote,
          seed: delegateAndCreateAccountWithSeed.seed,
          lamports: +delegateAndCreateAccountWithSeed.amount * LAMPORTS_PER_SOL,
          recentBlockhash,
        };

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signDelegateAndCreateAccountWithSeed({
          transport: transport as Transport,
          appPrivateKey,
          addressIndex: 0,
          appId,
          transaction: tx,
        });

        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
      },
      (result) => setDelegateAndCreateAccountWithSeed((prev: any) => ({ ...prev, result }))
    );

  const signStakingWithdraw = () =>
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const stakePubkey = await sol.createWithSeed(
          account,
          delegateAndCreateAccountWithSeed.seed,
          StakeProgram.programId.toString()
        );

        const signTxData = {
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: {
            stakePubkey,
            withdrawToPubKey: stakingWithdraw.toPubkey,
            recentBlockhash,
            lamports: +stakingWithdraw.value * LAMPORTS_PER_SOL,
          },
          addressIndex: 0,
        };

        console.log('TX:', signTxData);

        const signedTx = await sol.signStackingWithdrawTransaction(signTxData);
        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return recoveredTx.serialize().toString('hex');
      },
      (result) => setStakingWithdraw((prev) => ({ ...prev, result }))
    );

  const sendTransaction = () =>
    handleState(async () => {
      return connection.sendRawTransaction(Buffer.from(txString, 'hex'));
    }, setTxResult);

  return (
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
            onChange: (token) =>
              setAssociateAccTx((prevState) => ({
                ...prevState,
                token,
              })),
            placeholder: 'token',
          },
          {
            xs: 2,
            value: associateAccTx.owner,
            onChange: (owner) =>
              setAssociateAccTx((prevState) => ({
                ...prevState,
                owner,
              })),
            placeholder: 'owner',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Create Account With Seed And Delegate'
        content={delegateAndCreateAccountWithSeed.result}
        onClick={signDelegateAndCreateAccountWithSeed}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: delegateAndCreateAccountWithSeed.seed,
            onChange: (seed) =>
              setDelegateAndCreateAccountWithSeed((prevState) => ({
                ...prevState,
                seed,
              })),
            placeholder: 'seed',
          },
          {
            xs: 1,
            value: delegateAndCreateAccountWithSeed.amount,
            onChange: (amount) =>
              setDelegateAndCreateAccountWithSeed((prevState) => ({
                ...prevState,
                amount,
              })),
            placeholder: 'amount',
          },
          {
            xs: 2,
            value: delegateAndCreateAccountWithSeed.vote,
            onChange: (vote) =>
              setDelegateAndCreateAccountWithSeed((prevState) => ({
                ...prevState,
                vote,
              })),
            placeholder: 'validator',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Staking Withdraw'
        content={stakingWithdraw.result}
        onClick={signStakingWithdraw}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: stakingWithdraw.seed,
            onChange: (seed) =>
              setStakingWithdraw((prevState) => ({
                ...prevState,
                seed,
              })),
            placeholder: 'seed',
          },
          {
            xs: 2,
            value: stakingWithdraw.value,
            onChange: (value: any) =>
              setStakingWithdraw((prevState: any) => ({
                ...prevState,
                value,
              })),
            placeholder: 'Withdraw value',
          },
          {
            xs: 2,
            value: stakingWithdraw.toPubkey,
            onChange: (toPubkey: any) =>
              setStakingWithdraw((prevState: any) => ({
                ...prevState,
                toPubkey,
              })),
            placeholder: 'toPubkey',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign'
        title='Undelegate'
        content={undelegate.result}
        onClick={signUndelegate}
        disabled={disabled}
        inputs={[
          {
            xs: 1,
            value: undelegate.seed,
            onChange: (seed) =>
              setUndelegate((prevState) => ({
                ...prevState,
                seed,
              })),
            placeholder: 'seed',
          },
        ]}
      />
      <div className='title2'>Send Tx</div>
      <Inputs
        btnTitle='Send'
        title='Send Transaction'
        content={txResult}
        onClick={sendTransaction}
        disabled={disabled}
        inputs={[
          {
            xs: 4,
            value: txString,
            onChange: setTxString,
            placeholder: 'tx bytes',
          },
        ]}
      />
    </Container>
  );
}

export default CoinSol;
