import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Transport } from '@coolwallet/core';
import { NoInput, OneInput, TwoInputs, ObjInputs } from '../../../utils/componentMaker';

import * as nearAPI from 'near-api-js';
import Near from '@coolwallet/near';
import { SignTransferTxType, TransferTxType,
         SignStakeTxType, StakeTxType,
         SignSmartTxType, SmartTxType,
         Action, TxnType } from '@coolwallet/near/lib/config/types';
import { BN } from 'bn.js';
const base58 = require('bs58');


// Add to coin-tester vite.config.ts
// server: {
//   proxy: {
//     '/rpc': {
//          target: 'https://rpc.testnet.near.org',
// //         target: 'https://rpc.mainnet.near.org', 
//          changeOrigin: true,
//          rewrite: (path) => path.replace(/^\/rpc/, '')
//     }
//   }
//   },

const tstReceiver = '';
const tstAmount = '0.05';
const tstValidator = 'ydgzeXHJ5Xyt7M1gXLxqLBW1Ejx6scNV5Nx2pxFM8su';
const tstGas = '0.00000000003';
// const tstCallId = 'meerkat.stakewars.testnet';
// const tstMethodName = 'get_balance';
// const tstMethodArgs = Buffer.from(JSON.stringify({}))
const tstCallId = 'leadnode.pool.f863973.m0'; //'cryptium.poolv1.near';
const tstMethodName = 'deposit_and_stake'; //'get_account';
const tstMethodArgs = {"amount": "100000000000000000000000"};
 
const networkId = "testnet";
// const networkId = "mainnet";
const rpcUrl = "https://rpc.testnet.near.org";
//const rpcUrl = "https://rpc.mainnet.near.org";

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
  const [stakeAmount, setStakeAmount] = useState(tstAmount);
  const [transferTo, setTransferTo] = useState(tstReceiver);
  const [smartKeys, setSmartKeys] = useState(['Address', 'Method', 'Arguments', 'Amount']);
  const [smartValues, setSmartValues] = useState([tstCallId, tstMethodName, JSON.stringify(tstMethodArgs), tstAmount]);


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

  const signTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get address first!');
      if (!transferTo) throw new Error('Enter receiver!');

      const { keyStores } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      let txnTransfer: TransferTxType = {
        receiver: transferTo,
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: tstAmount
      };
      
      console.log(txnTransfer);

      let signTxData: SignTransferTxType = {
        transport: transport!,
        appPrivateKey: appPrivateKey,
        appId: appId,
        transaction: txnTransfer
      }
      
      const signedTx = await nearCoin.signTransferTransaction(signTxData);
      console.log(signedTx);

      txnTransfer.sender = address;
      txnTransfer.publicKey = publicKey;
      await propagateTxn(config, txnTransfer, TxnType.TRANSFER, signedTx);

      return signedTx;
    }, setSignedTransaction);
  };

  const signStakeTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!address) throw new Error('Get addramountess first!');

      const { keyStores } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      const txnStake: StakeTxType = {
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: stakeAmount,
        validatorPublicKey: tstValidator
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
      console.log(signedTx);

      txnStake.sender = txnStake.receiver = address;
      txnStake.publicKey = publicKey;
      await propagateTxn(config, txnStake, TxnType.STAKE, signedTx);

      return signedTx;
    }, setSignedStakeTransaction);
  };

  const signSmartTransaction = async () => {
    handleState(async () => {

      const appId = localStorage.getItem('appId');
      if (!address) throw new Error('Get address first!');
      if (!appId) throw new Error('No Appid stored, please register!');
      if (!smartValues[0]) throw new Error('Enter receiver!');
      if (!smartValues[1]) throw new Error('Enter method name!');

      const { keyStores } = nearAPI;
      let config = {
        networkId: networkId,
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "/rpc",
        rpcUrl: rpcUrl,
        headers: { 'x-api-key': appId },
      };

      const publicKey = base58.encode(Buffer.from(address, 'hex'));

      console.log('publicKey: ' + publicKey);

      const { nonce, blockHash } = await prepareSenderAccData(config, address, publicKey);

      const txnSmart: SmartTxType = {
        receiver: smartValues[0],
        nonce: nonce,
        recentBlockHash: blockHash,
        amount: smartValues[3],
        gas: tstGas,
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
      console.log(signedTx);

      await propagateTxn(config, txnSmart, TxnType.SMART, signedTx);

      return signedTx;
    }, setSignedSmartTransaction);
  };

  const prepareSenderAccData = async (
      config: any,
      sender: string,
      publicKey: string,
    ): Promise<{nonce: number, blockHash: string}> => {
    const near = await nearAPI.connect(config);
    const accountS = await near.account(sender);
    try {
      const state = await accountS.state();
      console.log(accountS.accountId + ' amount: ' + state.amount);
    } catch {
      throw new Error('Create sender account!');
    }
    const provider = new nearAPI.providers.JsonRpcProvider(config.rpcUrl);
    setTransferTo
    const accessKey = await provider.query(
      `access_key/${sender}/${publicKey}`, ''
    );

    const nonce =  ++accessKey.nonce;

    const block = await accountS.connection.provider.block({ finality: 'final' });
    const blockHash = block.header.hash;

    return { nonce: nonce, blockHash: blockHash };
  }

  const propagateTxn = async (
    config: any,
    txn: any,
    txnType: TxnType,
    sign: any
  ) => {

    const amount = nearAPI.utils.format.parseNearAmount(txn.amount);
  
    let actions: nearAPI.transactions.Action[];
  
    switch(txnType) { 
      case TxnType.TRANSFER: { 
        actions = [nearAPI.transactions.transfer(new BN(amount))];
        break;
      } 
      case TxnType.STAKE: { 
        actions = [nearAPI.transactions.stake(new BN(amount), nearAPI.utils.key_pair.PublicKey.from(txn.validatorPublicKey!))]; 
        break; 
      } 
      case TxnType.SMART: {
        actions = [nearAPI.transactions.functionCall(txn.methodName!, txn.methodArgs!,
          new BN(nearAPI.utils.format.parseNearAmount(txn.gas)!), new BN(amount))];
        break;  
      } 
    }

      // create transaction
    const transaction = nearAPI.transactions.createTransaction(
      txn.sender, 
      nearAPI.utils.key_pair.PublicKey.from(txn.publicKey), 
      txn.receiver,
      txn.nonce,
      actions, 
      nearAPI.utils.serialize.base_decode(txn.recentBlockHash)
    );

    const sgnTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: transaction,
      signature: new nearAPI.transactions.Signature({ 
        keyType: 0, 
        data: Buffer.from(sign.toString(), 'hex') 
      })
    });

    // send the transaction!
    try {
      // encodes signed transaction to serialized Borsh (required for all transactions)
      const signedSerializedTx = sgnTransaction.encode();
      // sends transaction to NEAR blockchain via JSON RPC call and records the result
      const provider = new nearAPI.providers.JsonRpcProvider(config.rpcUrl);
      const result = await provider.sendJsonRpc(
        'broadcast_tx_commit', 
        [Buffer.from(signedSerializedTx).toString('base64')]
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