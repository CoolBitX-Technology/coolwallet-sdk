import { useState } from 'react';
import { Container } from 'react-bootstrap';
import CoinALGO from '@coolwallet/algo';
import { apdu, Transport } from '@coolwallet/core';
import Inputs from '../../Inputs';
import { useRequest } from '../../../utils/hooks';
import type { FC } from 'react';
import algosdk from "algosdk";

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

  const [payload, setPayload] = useState('');
  const [result, setResult] = useState('');
  const [address, setAddress] = useState('');
  const [receiver, setReceiver] = useState('5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U');
  const [signature, setSignature] = useState('');
  const [amount, setAmount] = useState('100000');
  const [assetAmount, setAssetAmount] = useState('0');
  const [assetId, setAssetId] = useState('82200197');
  const [appIndex, setAppIndex] = useState('82200197');
  const [assetName, setAssetName] = useState('coolbitx');
  const [total, setTotal] = useState("1000");
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

    return coinALGO.signTransaction(signTxData);
  }

  const getTransaction = async () => {
    try {
      const signed = await apdu.tx.getSignedHex(props.transport!);
      setPayload(signed.signedTx);
    } catch (error) {
      console.error(error);
    }
  };

  const sendTransaction = async () => {
    const signedTransaction = Uint8Array.from(Buffer.from(signature, 'hex'))
    setResult((await algodClient.sendRawTransaction(signedTransaction).do()).txId);
  }

  const signPaymentTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Payment Transaction");

    useRequest(async () => {
      let transactionObject = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: receiver,
        amount: Number(amount),
        note: note,
        suggestedParams: params
      });

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
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

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
    }, props).then(setSignature);
  };

  const signAssetConfigTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Asset Config Transaction");

    useRequest(async () => {
      let transactionObject = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: address,
        total: Number(total),
        defaultFrozen: true,
        unitName: assetName,
        assetName: assetName,
        decimals: 4,
        assetURL: 'https://someurl',
        suggestedParams: params,
        note: note,
        manager: address,
        freeze: address,
        clawback: address,
        reserve: address,
      });

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
    }, props).then(setSignature);
  };

  const signAssetFreezeTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Asset Freeze Transaction");

    useRequest(async () => {
      let transactionObject = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
        from: address,
        freezeState: true,
        freezeTarget: freezeAddress,
        assetIndex: Number(freezeAssetId),
        suggestedParams: params,
        note: note,
      });

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
    }, props).then(setSignature);
  };

  const signApplicationCallTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const enc = new TextEncoder();
    const note = enc.encode("Application Call Transaction");

    useRequest(async () => {
      let transactionObject = algosdk.makeApplicationCallTxnFromObject({
        from: address,
        appIndex: Number(appIndex),
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [stringToBytes("first argument"), stringToBytes("second argument"), algosdk.encodeUint64(125)],
        foreignApps: [1, 2, 3],
        foreignAssets: [1, 2, 3],
        accounts: ["5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U", "5B3X56E3KVGS3D5263AWYWMUFBJUX7IZ3OYBUYVH6AB4ZDNJSGT4MQAG2U"],
        suggestedParams: params,
        note: note,
      });

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
    }, props).then(setSignature);
  };

  const signCustomTransaction = async () => {
    let params = await algodClient.getTransactionParams().do();
    const index = 100932848
    const sender = "PG62AH3JJUKGTMKGCHRC6RQG4WBIQGJ4ZOR4BFPHOR3VY3BK2ZLBHVEHCE";

    useRequest(async () => {
      let transactionObject = algosdk.makeApplicationDeleteTxn(sender, params, index);

      const transactionForSDK = transactionObject.get_obj_for_encoding();
      console.log("Transaction Object : ", transactionForSDK);

      return signTransaction(transactionForSDK);
    }, props).then(setSignature);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <Inputs btnTitle='Get Address' title='Address' content={address} onClick={getAddress} disabled={disabled} />
      <Inputs
        title='Signed Transaction'
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
        onClick={() => sendTransaction()}
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
            value: appIndex,
            onChange: setAppIndex,
            placeholder: 'App ID',
          },
        ]}
      />
      <Inputs
        btnTitle='Sign Custom Transaction'
        title='Custom Transaction'
        content={""}
        onClick={signCustomTransaction}
        disabled={disabled}
        inputs={[]}
      />
    </Container>
  );
};

export default CoinAlgoPage;
