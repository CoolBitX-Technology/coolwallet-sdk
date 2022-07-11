import { useState } from 'react';
import { Container } from 'react-bootstrap';
import CoinALGO from '@coolwallet/algo';
import { apdu, Transport } from '@coolwallet/core';
import Inputs from '../../Inputs';
import { useRequest } from '../../../utils/hooks';
import type { FC } from 'react';
import algosdk from "algosdk";
const msgpack = require('algo-msgpack-with-bigint');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

// Initialize Algod Client
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'http://localhost';
const algodPort = 4001;
let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

const CoinAlgoPage: FC<Props> = (props: Props) => {
  const coinALGO = new CoinALGO();
  const disabled = !props.transport || props.isLocked;

  const [transaction, setTransaction] = useState({});
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState('');
  const [address, setAddress] = useState('');
  const [receiver, setReceiver] = useState('5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U');
  const [signature, setSignature] = useState('');
  const [amount, setAmount] = useState('100000');
  const [assetAmount, setAssetAmount] = useState('0');
  const [assetId, setAssetId] = useState('82200197');
  const [appId, setAppId] = useState('82200197');
  const [assetName, setAssetName] = useState('coolbitx');
  const [total, setTotal] = useState("1000");
  const [defaultFrozen, setDefaultFrozen] = useState(true);
  const [assetFreeze, setAssetFreeze] = useState(true);
  const [freezeAddress, setFreezeAddress] = useState('5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U');
  const [freezeAssetId, setFreezeAssetId] = useState('82200197');

  const getAddress = () => {
    useRequest(async () => {
      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      return coinALGO.getAddress(props.transport!, props.appPrivateKey, appId);
    }, props).then(setAddress);
  };

  const stringToBytes = (value: any) => {
    return new Uint8Array(Buffer.from(value));
  }

  const signTransaction = async (transaction: any) => {
    const appId = localStorage.getItem('appId');
    if (!appId) throw new Error('No Appid stored, please register!');

    const signTxData = {
      transport: props.transport!,
      appPrivateKey: props.appPrivateKey,
      appId,
      transaction: transaction,
      addressIndex: 0,
    };

    const signature = await coinALGO.signTransaction(signTxData);
    return signature;
  }

  const getTransaction = async () => {
    try {
      const signed = await apdu.tx.getSignedHex(props.transport!);
      setPayload(signed.signedTx);
    } catch (error) {
      console.error(error);
    }
  };

  const sendTransaction = async (signature: string, transaction: any) => {
    let signedTransaction = {
      sig: Buffer.from(signature, 'hex'),
      txn: transaction,
    };

    const options = { sortKeys: true };
    let encodedSignedTransaction = new Uint8Array(msgpack.encode(signedTransaction, options))
    setResult((await algodClient.sendRawTransaction(encodedSignedTransaction).do()).txId);
  }

  const signPaymentTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("PaymentTransaction");

    useRequest(async () => {
      let transactionObject = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: receiver,
        amount: Number(amount),
        note: note,
        suggestedParams: params
      });

      let transaction = transactionObject.get_obj_for_encoding();
      setTransaction(transaction);
      console.log("Transaction Object : ", transaction);

      const signature = await signTransaction(transaction);
      return signature;
    }, props).then(setSignature);
  };

  const signAssetTransferTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Asset Transfer Transaction");

    useRequest(async () => {
      let transactionObject = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address,
        to: receiver,
        assetIndex: Number(assetId),
        amount: Number(assetAmount),
        note: note,
        suggestedParams: params
      });

      let transaction = transactionObject.get_obj_for_encoding();
      setTransaction(transaction);
      console.log("Transaction Object : ", transaction);

      const signature = await signTransaction(transaction);
      return signature;
    }, props).then(setSignature);
  };

  const signAssetConfigTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Asset Config Transaction");

    useRequest(async () => {
      let transactionObject = await algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: address,
        total: Number(total),
        defaultFrozen: defaultFrozen,
        unitName: "COOL",
        decimals: 4,
        assetURL: 'http://someurl',
        suggestedParams: params,
        note: note,
        manager: address,
        freeze: address,
        clawback: address,
        reserve: address,
      });

      let transaction = transactionObject.get_obj_for_encoding();
      setTransaction(transaction);
      console.log("Transaction Object : ", transaction);

      const signature = await signTransaction(transaction);
      return signature;
    }, props).then(setSignature);
  };

  const signAssetFreezeTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Asset Freeze Transaction");

    useRequest(async () => {
      let transactionObject = await algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
        from: address,
        freezeState: assetFreeze,
        freezeTarget: freezeAddress,
        assetIndex: Number(freezeAssetId),
        suggestedParams: params,
        note: note,
      });

      let transaction = transactionObject.get_obj_for_encoding();
      setTransaction(transaction);
      console.log("Transaction Object : ", transaction);

      const signature = await signTransaction(transaction);
      return signature;
    }, props).then(setSignature);
  };

  const signApplicationCallTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Application Call Transaction");

    useRequest(async () => {
      let transactionObject = await algosdk.makeApplicationCallTxnFromObject({
        from: address,
        appIndex: Number(appId),
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [stringToBytes("first argument"), stringToBytes("second argument"), algosdk.encodeUint64(125)],
        foreignApps: [1, 2, 3],
        foreignAssets: [1, 2, 3],
        accounts: ["5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U", "5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U"],
        suggestedParams: params,
        note: note,
      });

      let transaction = transactionObject.get_obj_for_encoding();
      setTransaction(transaction);
      console.log("Transaction Object : ", transaction);

      const signature = await signTransaction(transaction);
      return signature;
    }, props).then(setSignature);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get Address' title='Address' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        title='Signature'
        content={signature}
        onClick={() => { }}
        disabled={true}
        inputs={[]}
      />
      <Inputs
        btnTitle='Get Payload'
        title='Payload'
        content={payload}
        onClick={() => getTransaction()}
        disabled={disabled}
        inputs={[]}
      />
      <Inputs
        btnTitle='Send Transaction'
        title='Transaction Hash'
        content={result}
        onClick={() => sendTransaction(signature, transaction)}
        disabled={disabled}
        inputs={[]}
      />
      <Inputs
        btnTitle='Sign Payment'
        title='Payment'
        content={""}
        onClick={signPaymentTransaction}
        disabled={disabled}
        inputs={[
          {
            value: receiver,
            onChange: setReceiver,
            placeholder: 'to',
          },
          {
            value: amount,
            onChange: setAmount,
            placeholder: 'amount',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign Asset Transfer'
        title='Asset Transfer'
        content={""}
        onClick={signAssetTransferTransaction}
        disabled={disabled}
        inputs={[
          {
            value: receiver,
            onChange: setReceiver,
            placeholder: 'to',
          },
          {
            value: assetAmount,
            onChange: setAssetAmount,
            placeholder: 'amount',
          },
          {
            value: assetId,
            onChange: setAssetId,
            placeholder: 'Asset Id',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign Asset Config'
        title='Asset Config'
        content={""}
        onClick={signAssetConfigTransaction}
        disabled={disabled}
        inputs={[
          {
            value: assetName,
            onChange: setAssetName,
            placeholder: 'Asset Name',
          },
          {
            value: total,
            onChange: setTotal,
            placeholder: 'Total',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign Asset Freeze'
        title='Asset Freeze'
        content={""}
        onClick={signAssetFreezeTransaction}
        disabled={disabled}
        inputs={[
          {
            value: freezeAssetId,
            onChange: setFreezeAssetId,
            placeholder: 'Asset Id',
          },
          {
            value: freezeAddress,
            onChange: setFreezeAddress,
            placeholder: 'Freeze Address',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign Application Call'
        title='Application Call'
        content={""}
        onClick={signApplicationCallTransaction}
        disabled={disabled}
        inputs={[
          {
            value: appId,
            onChange: setAppId,
            placeholder: 'App ID',
          },
        ]}
      />
    </Container>
  );
};

export default CoinAlgoPage;
