import { useState } from 'react';
import { Transport } from '@coolwallet/core';
import SOL from '@coolwallet/sol';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Container } from 'react-bootstrap';
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
  //const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sol = new SOL();

  const { transport, appPrivateKey } = props;
  const disabled = !transport || props.isLocked;

  const [account, setAccount] = useState('');

  const [transaction, setTransaction] = useState({
    to: 'AnJZ8PLH3YZVJRifPb2jLXDwaKXtScHrQmpCiQ3vS8jm',
    value: '0.000001',
    result: '',
  });

  const [splTokenTransaction, setSplTokenTransaction] = useState({
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    to: 'eMisCj89rxrvPPPGqWAA6VK72W2b8Y4WogR1MP3KVvF',
    amount: '0.000001',
    decimals: '6',
    result: '',
  });
  const [associateAccTx, setAssociateAccTx] = useState({
    token: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    owner: 'AnJZ8PLH3YZVJRifPb2jLXDwaKXtScHrQmpCiQ3vS8jm',
    result: '',
  });

  const [stakingWithdraw, setStakingWithdraw] = useState({
    value: '0',
    stakingAcc: 'AnJZ8PLH3YZVJRifPb2jLXDwaKXtScHrQmpCiQ3vS8jm',
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
      return sol.getAddress(transport!, appPrivateKey, appId, 0);
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

  // fir transfer spl-token
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

        const toPubKey = transaction.to;
        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');
        const signedTx = await sol.signTransaction({
          transport: transport as Transport,
          appPrivateKey,
          appId,
          addressIndex: 0,
          transaction: {
            toPubKey,
            recentBlockhash,
            amount: transaction.value,
          },
        });
        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return connection.sendRawTransaction(recoveredTx.serialize());
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
          amount: splTokenTransaction.amount,
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

        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setAssociateAccTx((prev: any) => ({ ...prev, result }))
    );
  };
  const signStakingWithdraw = async () => {
    handleState(
      async () => {
        if (account.length < 1) throw new Error('please get account first');

        const appId = localStorage.getItem('appId');
        if (!appId) throw new Error('No Appid stored, please register!');

        const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

        const signTxData = {
          transport: transport as Transport,
          appPrivateKey,
          appId,
          transaction: {
            stakePubkey: stakingWithdraw.stakingAcc,
            withdrawToPubKey: account,
            recentBlockhash,
            amount: stakingWithdraw.value,
          },
          addressIndex: 0,
        };

        console.log('TX:', signTxData)

        const signedTx = await sol.signTransaction(signTxData);
        const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

        const verifySig = recoveredTx.verifySignatures();

        // signature need to be valid
        if (!verifySig) throw new Error('Fail to verify signature');

        return connection.sendRawTransaction(recoveredTx.serialize());
      },
      (result) => setStakingWithdraw((prev: any) => ({ ...prev, result }))
    );
  };
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
      <Inputs
        btnTitle='Withdraw'
        title='Staking Withdraw'
        content={stakingWithdraw.result}
        onClick={signStakingWithdraw}
        disabled={disabled}
        inputs={[
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
            value: stakingWithdraw.stakingAcc,
            onChange: (stakingAcc: any) =>
              setStakingWithdraw((prevState: any) => ({
                ...prevState,
                stakingAcc,
              })),
            placeholder: 'Staking account',
          },
        ]}
      />
    </Container>
  );
}

export default CoinSol;
