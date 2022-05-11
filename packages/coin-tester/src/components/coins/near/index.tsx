import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import {
  SignTransferTxType,
  TransferTxType,
  SignStakeTxType,
  StakeTxType,
  SignSmartTxType,
  SmartTxType,
  Action,
  TxnType
} from '@coolwallet/near/lib/config/types';
import { BN } from 'bn.js';
const base58 = require('bs58');
 
// const networkId = "testnet";
const networkId = "mainnet";
const config = {
  networkId,
  keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: `https://rpc.${networkId}.near.org`,
  walletUrl: `https://wallet.${networkId}.near.org`,
  helperUrl: `https://helpter.${networkId}.near.org`,
  explorerUrl: `https://explorer.${networkId}.near.org`,
};

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinNear(props: Props) {
  const nearCoin = new Near();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [signedStakeTransaction, setSignedStakeTransaction] = useState('');
  const [signedSmartTransaction, setSignedSmartTransaction] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.05');
  const [transferTo, setTransferTo] = useState('745959ae6125245baa6904a1da36d3608a11d1c8b908c147efa99e4f3abc1029');
  const [smartKeys, setSmartKeys] = useState([
    'ReceiverId',
    'Method',
    'Arguments',
    'Amount'
  ]);
  const [smartValues, setSmartValues] = useState([
    'astro-stakers.poolv1.near',
    'deposit_and_stake',
    JSON.stringify({}), // {"amount": "100000000000000000000000"}
    '0.25'
  ]);

  const { transport, appPrivateKey} = props;
  const disabled = !transport || props.isLocked;

  const handleState = async (
    request: () => Promise<string>,
    handleResponse: (response: string) => void
  ) => {
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

      return await nearCoin.getAddress(transport!, appPrivateKey, appId);
    }, setAddress);
  };

  const prepareSenderAccData = async (
    sender: string,
    publicKey: string,
  ): Promise<{nonce: number, blockHash: string}> => {
    const near = await nearAPI.connect(config);
    const accountS = await near.account(sender);
    console.log('accountS :', accountS);
    try {
      const state = await accountS.state();
      console.log(accountS.accountId + ' amount: ' + state.amount);
    } catch {
      throw new Error('Create sender account!');
    }
    const provider = new nearAPI.providers.JsonRpcProvider(config.nodeUrl);
    const accessKey = await provider.query(`access_key/${sender}/${publicKey}`, '');
    console.log('accessKey :', accessKey);

    const nonce = accessKey.nonce + 1;

    const block = await accountS.connection.provider.block({ finality: 'final' });
    const blockHash = block.header.hash;

    return { nonce: nonce, blockHash: blockHash };
  }

  const propagateTxn = async (
    signedTx: string
  ) => {
    try {
      // sends transaction to NEAR blockchain via JSON RPC call and records the result
      const provider = new nearAPI.providers.JsonRpcProvider(config.nodeUrl);
      const result = await provider.sendJsonRpc(
        'broadcast_tx_commit',
        [Buffer.from(signedTx, 'hex').toString('base64')]
      );
      console.log(result);
      console.log('Transaction Results: ', result.transaction);
      console.log('--------------------------------------------------------------------------------------------');
      console.log('OPEN LINK BELOW to see transaction in NEAR Explorer!');
      console.log(`$https://explorer.${config.networkId}.near.org/transactions/${result.transaction.hash}`);
      console.log('--------------------------------------------------------------------------------------------');
    } catch(error) {
      console.log(error);
    }
  }

  const signTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');
      if (!transferTo) throw new Error('Enter receiver!');

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(address, publicKey);

      const txnTransfer: TransferTxType = {
        receiver: transferTo,
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: '0.05'
      };
      console.log('txnTransfer :', txnTransfer);

      const signTxData: SignTransferTxType = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        transaction: txnTransfer
      }
      
      const signedTx = await nearCoin.signTransferTransaction(signTxData);
      await propagateTxn(signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  const signStakeTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(address, publicKey);

      const txnStake: StakeTxType = {
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: stakeAmount,
        validatorPublicKey: ''
      };

      console.log(txnStake);

      const signTxData: SignStakeTxType = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        transaction: txnStake
      }

      const signedTx = Number(txnStake.amount) != 0 ?
        await nearCoin.signStakeTransaction(signTxData) :
        await nearCoin.signUnstakeTransaction(signTxData);
      await propagateTxn(signedTx);

      return signedTx;
    }, setSignedStakeTransaction);
  };

  const signSmartTransaction = async () => {
    handleState(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');
      if (!smartValues[0]) throw new Error('Enter receiver!');
      if (!smartValues[1]) throw new Error('Enter method name!');

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(address, publicKey);

      const txnSmart: SmartTxType = {
        receiver: smartValues[0],
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: smartValues[3],
        gas: '300000000000000', // Max
        methodName: smartValues[1],
        methodArgs: Buffer.from(smartValues[2])
      };
      
      console.log(txnSmart);

      txnSmart.sender = address;
      txnSmart.publicKey = publicKey;
      if(!txnSmart.amount) {
        txnSmart.amount = '0';
      }
      const signTxData: SignSmartTxType = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        transaction: txnSmart
      }

      let signedTx = '';
      switch (txnSmart.methodName) {
        case "deposit_and_stake":
          signedTx = await nearCoin.signSCStakeTransaction(signTxData);
          break;
        case "unstake":
          signedTx = await nearCoin.signSCUnstakeTransaction(signTxData);
          break;
        case "unstake_all":
          signedTx = await nearCoin.signSCUnstakeAllTransaction(signTxData);
          break;
        case "withdraw":
          signedTx = await nearCoin.signSCWithdrawTransaction(signTxData);
          break;
        case "withdraw_all":
          signedTx = await nearCoin.signSCWithdrawAllTransaction(signTxData);
          break;
        default:
          signedTx = await nearCoin.signSmartTransaction(signTxData);
      }

      await propagateTxn(signedTx);

      return signedTx;
    }, setSignedSmartTransaction);
  };

  return (
    <Container>
      <div className='title2'>
        These two basic methods are required to implement in a coin sdk.
      </div>
      <NoInput
        title='Get Address'
        content={address}
        onClick={getAddress}
        disabled={disabled}
      />
      <OneInput
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
        value={transferTo}
        setValue={setTransferTo}
        placeholder='transfer to'
        inputSize={3}
      />
      <OneInput
        title='Sign Stake'
        content={signedStakeTransaction}
        onClick={signStakeTransaction}
        disabled={disabled}
        btnName='Sign'
        value={stakeAmount}
        setValue={setStakeAmount}
        placeholder='amount'
        inputSize={1}
      />
      <br/>
      <h4 style={{ color: 'orange' }}>Smart Contract Based Staking methods: deposit_and_stake, unstake, unstake_all, withdraw and withdraw_all</h4>
      <ObjInputs
        title='Sign Smart Contract'
        content={signedSmartTransaction}
        onClick={signSmartTransaction}
        disabled={disabled}
        keys={smartKeys}
        values={smartValues}
        setValues={setSmartValues}
        btnName='Sign'
      />
    </Container>
  );
}

export default CoinNear;
