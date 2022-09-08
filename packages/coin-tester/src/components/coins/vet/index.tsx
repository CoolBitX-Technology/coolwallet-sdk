import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';

import VET from '@coolwallet/vet';
import { getRawTx } from '@coolwallet/vet/src/utils/transactionUtil';
import { handleHex } from '@coolwallet/vet/src/utils/stringUtil';
import { useRequest } from '../../../utils/hooks';
const rlp = require('rlp');
const blake2b = require('blake2b');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak');

interface Props {
  transport: Transport | null;
  appPrivateKey: string;
  appPublicKey: string;
  isLocked: boolean;
  setIsLocked: (isLocked: boolean) => void;
}

import Connex from '@vechain/connex';
import { safeToLowerCase } from '@coolwallet/vet/src/utils/scriptUtil';
import Inputs from '../../Inputs';
const connex = new Connex({
  node: 'https://testnet.veblocks.net',
  network: 'test',
});

function CoinVet(props: Props) {
  const temp = new VET();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [signedToken, setSignedToken] = useState('');
  const [signedVIP191TransactionOrigin, setSignedVIP191TransactionOrigin] = useState('');
  const [signedCertificate, setSignedCertificate] = useState('');
  const [signedSmartContract, setSignedSmartContract] = useState('');
  const [value, setValue] = useState('0.001');
  const [token, setToken] = useState('1');
  const [vip191Value, setVip191Value] = useState('0');
  const [to, setTo] = useState('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed');
  const [vthoTo, setVthoTo] = useState('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed');
  const [vip191To, setVip191To] = useState('0x8384738c995d49c5b692560ae688fc8b51af1059');
  const [vip191Data, setVip191Data] = useState('0xd09de08a');
  const [smartContract, setSmartContract] = useState('0xa4bF5a32d0F1D1655eeC3297023fd2136Bd760a2');
  const [smartContractData, setSmartContractData] = useState(
    '0x42842e0e00000000000000000000000022e14b199e0bd524fda275b5665056a4cd0675f60000000000000000000000009cd315551c2f96bb978ed24687f6cea6b4097995000000000000000000000000000000000000000000000000000000000000016f'
  );

  const [content, setContent] = useState('new message');

  const { appPrivateKey } = props;
  const transport = props.transport;
  const disabled = !transport || props.isLocked;

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
      return await temp.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = () => {
    useRequest(async () => {
      const transaction = {
        // chainTag: '0x27',
        chainTag: '0x4a',
        blockRef: connex.thor.status.head.id.slice(0, 18),
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: to,
            value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
            data: '0x',
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(10000000),
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567cabb5',
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      };
      console.log('signTxData: ', { signTxData });

      const signedTx = await temp.signTransaction(signTxData);

      // Submit the raw transaction by hand to the test-net.
      const url = 'https://testnet.veblocks.net/transactions';
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: signedTx,
        }),
      })
        .then((response) => {
          response.text().then((r) => {
            console.log(r);
          });
        })
        .catch((err) => {
          console.log('err', err);
        });

      return signedTx;
    }, props).then(setSignedTransaction);
  };

  const signToken = () => {
    useRequest(async () => {
      const transaction = {
        // chainTag: '0x27',
        chainTag: '0x4a',
        blockRef: connex.thor.status.head.id.slice(0, 18),
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: '0x0000000000000000000000000000456E65726779',
            value: '0x', //this stands for vet, vtho transaction will ignore vet value
            data:
              '0xa9059cbb000000000000000000000000' +
              vthoTo.slice(2) +
              web3.utils.toHex(web3.utils.toWei(token, 'ether')).slice(2).padStart(64, '0'),
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(10000000),
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567cabb5',
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      };
      console.log('signTxData: ', { signTxData });

      const signedTx = await temp.signToken(signTxData);

      // Submit the raw transaction by hand to the test-net.
      const url = 'https://testnet.veblocks.net/transactions';
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: signedTx,
        }),
      })
        .then((response) => {
          response.text().then((r) => {
            console.log(r);
          });
        })
        .catch((err) => {
          console.log('err', err);
        });

      return signedTx;
    }, props).then(setSignedToken);
  };

  const signVIP191TransactionOrigin = () => {
    useRequest(async () => {
      const transaction = {
        // chainTag: web3.utils.toHex(39),
        chainTag: web3.utils.toHex(74),
        blockRef: connex.thor.status.head.id.slice(0, 18),
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: vip191To,
            value: web3.utils.toHex(web3.utils.toWei(vip191Value, 'ether')),
            data: vip191Data,
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(10000000),
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567ca467',
        reserved: {
          features: 1,
        },
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      };
      console.log('signTxData: ', { signTxData });

      const signedTx = await temp.signVIP191TransactionOrigin(signTxData);

      const rawTx = getRawTx(transaction);
      const rawData = rlp.encode(rawTx);
      console.log('rawData', '0x' + rawData.toString('hex'));

      let sponsorSignature: string;

      const url = 'https://sponsor-testnet.vechain.energy/by/119';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: address,
          raw: '0x' + rawData.toString('hex'),
        }),
      });
      console.log('response', { response });

      const r: any = await response.json();
      console.log('r', { r });
      sponsorSignature = r.signature;
      console.log('sponsor sig', sponsorSignature);

      const decoded = rlp.decode(signedTx);
      const sig = Buffer.concat([decoded.at(-1), Buffer.from(handleHex(sponsorSignature), 'hex')]);
      rawTx.push(sig);
      const raw = rlp.encode(rawTx);
      console.log('raw to testnet', '0x' + raw.toString('hex'));

      // Submit the raw transaction by hand to the test-net.
      fetch('https://testnet.veblocks.net/transactions', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: '0x' + raw.toString('hex') }),
      })
        .then((response) => {
          response.text().then((r) => {
            console.log(r);
          });
        })
        .catch((err) => {
          console.log('err', err);
        });

      return signedTx;
    }, props).then(setSignedVIP191TransactionOrigin);
  };

  const signCertificate = () => {
    useRequest(async () => {
      const certificate = {
        purpose: 'identification',
        payload: {
          type: 'text',
          content: content,
        },
        domain: 'localhost',
        timestamp: 1545035330,
        signer: address,
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signCertData = {
        transport,
        appPrivateKey,
        certificate,
        appId,
        addressIndex: 0,
      };
      console.log('signCertData: ', { signCertData });

      const signedTx = await temp.signCertificate(signCertData);

      const siginingHex = getCertificateHex(certificate);
      const signingHash = blake2b(32).update(Buffer.from(siginingHex, 'hex')).digest();

      const sig = Buffer.from(signedTx.slice(2), 'hex');
      const recovery = sig[64];
      const r = sig.subarray(0, 32);
      const s = sig.subarray(32, 64);

      const pubKey = Buffer.from(ec.recoverPubKey(signingHash, { r, s }, recovery).encode('array', false));

      const addr =
        '0x' +
        Buffer.from(createKeccakHash('keccak256').update(pubKey.subarray(1)).digest())
          .subarray(12)
          .toString('hex');
      console.log('addr', addr);
      console.log('signer', certificate.signer);
      if (addr == safeToLowerCase(certificate.signer)) {
        console.log('verify done');
      }

      return signedTx;
    }, props).then(setSignedCertificate);
  };

  const signSmartContract = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: '0x27',
        // chainTag: '0x4a',
        blockRef: connex.thor.status.head.id.slice(0, 18),
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: smartContract,
            value: '0x',
            data: smartContractData,
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(10000000),
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567cabb5',
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      };
      console.log('signTxData: ', { signTxData });

      const signedTx = await temp.signTransaction(signTxData);

      // Submit the raw transaction by hand to the test-net.
      const url = 'https://testnet.veblocks.net/transactions';
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: signedTx,
        }),
      })
        .then((response) => {
          response.text().then((r) => {
            console.log(r);
          });
        })
        .catch((err) => {
          console.log('err', err);
        });

      return signedTx;
    }, props).then(setSignedSmartContract);
  };

  return (
    <Container>
      <div className='title2'>These two basic methods are required to implement in a coin sdk.</div>
      <NoInput title='Get Address' content={address} onClick={getAddress} disabled={disabled} />
      <TwoInputs
        title='Sign Transaction'
        content={signedTransaction}
        onClick={signTransaction}
        disabled={disabled}
        btnName='Sign'
        value={value}
        setValue={setValue}
        placeholder='value'
        inputSize={1}
        value2={to}
        setValue2={setTo}
        placeholder2='to'
        inputSize2={3}
      />

      <TwoInputs
        title='Sign VTHO token'
        content={signedToken}
        onClick={signToken}
        disabled={disabled}
        btnName='Sign Token'
        value={vthoTo}
        setValue={setVthoTo}
        placeholder='to'
        inputSize={3}
        value2={token}
        setValue2={setToken}
        placeholder2='50 VTHO'
        inputSize2={1}
      />

      <TwoInputs
        title='Sign VIP191 Transaction Origin (user)'
        content={signedVIP191TransactionOrigin}
        onClick={signVIP191TransactionOrigin}
        disabled={disabled}
        btnName='Sign'
        value={vip191To}
        setValue={setVip191To}
        placeholder='contract'
        inputSize={3}
        value2={vip191Data}
        setValue2={setVip191Data}
        placeholder2='data'
        inputSize2={1}
      />

      <OneInput
        title='Sign Certificate'
        content={signedCertificate}
        onClick={signCertificate}
        disabled={disabled}
        btnName='Sign'
        value={content}
        setValue={setContent}
        placeholder='content'
        inputSize={3}
      />

      <TwoInputs
        title='Sign Smart Contract'
        content={signedSmartContract}
        onClick={signSmartContract}
        disabled={disabled}
        btnName='Sign'
        value={smartContract}
        setValue={setSmartContract}
        placeholder='to'
        inputSize={3}
        value2={smartContractData}
        setValue2={setSmartContractData}
        placeholder2='data'
        inputSize2={3}
      />

    </Container>
  );
}

export default CoinVet;
