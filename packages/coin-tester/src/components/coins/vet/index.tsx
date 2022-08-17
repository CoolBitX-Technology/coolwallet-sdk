import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, OneInput, TwoInputs } from '../../../utils/componentMaker';

import VET from '@coolwallet/vet'
import { getRawTx, getRawDelegatorTx, getCertificateHex } from '@coolwallet/vet/src/utils/transactionUtil'
import { handleHex } from '@coolwallet/vet/src/utils/stringUtil'
import { useRequest } from '../../../utils/hooks';
const rlp = require('rlp');
const blake2b = require('blake2b');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const createKeccakHash = require('keccak');

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked: boolean) => void,
}

import Connex from "@vechain/connex";
import { safeToLowerCase } from '@coolwallet/vet/src/utils/scriptUtil';
const connex = new Connex({
  node: "https://testnet.veblocks.net",
  network: "test"
});

function CoinVet(props: Props) {
  const temp = new VET();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [signedVIP191TransactionOrigin, setSignedVIP191TransactionOrigin] = useState('');
  // const [signedVIP191TransactionDelegator, setSignedVIP191TransactionDelegator] = useState('');
  const [signedCertificate, setSignedCertificate] = useState('');
  const [value, setValue] = useState('0.001');
  const [to, setTo] = useState('0x7567d83b7b8d80addcb281a71d54fc7b3364ffed');
  // const [delegatorFor, setDelegatorFor] = useState('0x8a02ef4030f5e4602030dfadaf91827c1db31dcf');

  const [content, setContent] = useState('new message');

  const { appPrivateKey } = props;
  const transport = props.transport;
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
      return await temp.getAddress(transport!, appPrivateKey, appId, 0);
    }, setAddress);
  };

  const signTransaction = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: '0x27',
        blockRef: web3.utils.toHex(55771463398518112),
        expiration: web3.utils.toHex(30 * 8640),
        clauses: [
          {
            to: to,
            value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
            data: '0xa9059cbb0000000000000000000000007c5Bc2EB55cE9f4Bf9BE2BBEFa1a3c79c8e11AC500000000000000000000000000000000000000000000000002c68af0bb140000',
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
      }
      console.log("signTxData: ", { signTxData });

      const signedTx = await temp.signTransaction(signTxData);

      const rawTx = getRawTx(transaction)
      rawTx.push(Buffer.from(handleHex(signedTx), 'hex'))
      const rawData = rlp.encode(rawTx)
      console.log("rawData to sync-testnet", '0x' + rawData.toString('hex'))

      // Submit the raw transaction by hand to the test-net.
      const url = 'https://testnet.veblocks.net/transactions'
      fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'raw': '0x' + rawData.toString('hex')
        })
      }).then(response => {
        response.text().then(r => { console.log(r) })
      }).catch(err => {
        console.log('err', err)
      })

      return signedTx;
    }, props).then(setSignedTransaction);
  }

  const signVIP191TransactionOrigin = () => {
    useRequest(async () => {
      const transaction = {
        chainTag: web3.utils.toHex(39),
        blockRef: connex.thor.status.head.id.slice(4, 18),
        expiration: web3.utils.toHex(32),
        clauses: [
          {
            to: "0x8384738c995d49c5b692560ae688fc8b51af1059",
            value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
            data: "0xd09de08a",
          },
        ],
        gasPriceCoef: web3.utils.toHex(128),
        gas: web3.utils.toHex(10000000),
        dependsOn: '0x',
        nonce: '0xf2ed7cd2567ca467',
        reserved: {
          features: 1
        }
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signTxData = {
        transport,
        appPrivateKey,
        transaction,
        appId,
        addressIndex: 0,
      }
      console.log("signTxData: ", { signTxData });

      const signedTx = await temp.signVIP191TransactionOrigin(signTxData);

      const rawTx = getRawTx(transaction)
      const rawData = rlp.encode(rawTx)
      console.log('rawData', '0x' + rawData.toString('hex'));

      let sponsorSignature: string

      const url = 'https://sponsor-testnet.vechain.energy/by/119'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'origin': address,
          'raw': '0x' + rawData.toString('hex')
        })
      })
      console.log("response", { response })

      const r: any = await response.json()
      console.log("r", { r })
      sponsorSignature = r.signature
      console.log("sponsor sig", sponsorSignature)

      const sig = Buffer.concat([
        Buffer.from(handleHex(signedTx), 'hex'),
        Buffer.from(handleHex(sponsorSignature), 'hex')
      ])
      rawTx.push(sig)
      const raw = rlp.encode(rawTx)
      console.log("raw to testnet", '0x' + raw.toString('hex'));


      // Submit the raw transaction by hand to the test-net.
      fetch('https://testnet.veblocks.net/transactions', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'raw': '0x' + raw.toString('hex') })
      }).then(response => {
        response.text().then(r => { console.log(r) })
      }).catch(err => {
        console.log('err', err)
      })


      return signedTx;
    }, props).then(setSignedVIP191TransactionOrigin);
  }

  // const signVIP191TransactionDelegator = () => {
  //   useRequest(async () => {
  //     // const priv1 = secp256k1.generatePrivateKey()
  //     // const addr1 = vaddress.fromPublicKey(secp256k1.derivePublicKey(priv1))
  //     // console.log("addr1: ", addr1)

  //     const transaction = {
  //       chainTag: web3.utils.toHex(39),
  //       blockRef: connex.thor.status.head.id.slice(4, 18),
  //       expiration: web3.utils.toHex(32),
  //       clauses: [
  //         {
  //           to: '0x8384738c995d49c5b692560ae688fc8b51af1059', // smart contract address
  //           value: web3.utils.toHex(web3.utils.toWei(value, 'ether')),
  //           data: '0xd09de08a' // smart contract function
  //         },
  //       ],
  //       gasPriceCoef: web3.utils.toHex(128),
  //       gas: web3.utils.toHex(10000000),
  //       dependsOn: '0x',
  //       nonce: '0xf2ed7cd2567c7456',
  //       reserved: {
  //         features: 1
  //       },
  //       delegatorFor: to
  //     };

  //     const appId = localStorage.getItem('appId');
  //     if (!appId) throw new Error('No Appid stored, please register!');
  //     const signTxData = {
  //       transport,
  //       appPrivateKey,
  //       transaction,
  //       appId,
  //       addressIndex: 0,
  //     }
  //     console.log("signTxData: ", { signTxData });

  //     const signedTx = await temp.signVIP191TransactionDelegator(signTxData);

  //     console.log("blockREf: [0x00c646824835b43b]", web3.utils.toHex(55809570759881787));


  //     const delegated = new Transaction({
  //       chainTag: 27,
  //       blockRef: '0x00c66981c3d8750b',
  //       expiration: 30 * 8640,
  //       clauses: [{
  //         to: '0xD4f02E8D5A56F271dAAD21DeC47d7151ca2FD111',
  //         value: '0x10000000000',
  //         data: '0x2e64cec1'
  //       }],
  //       gasPriceCoef: 128,
  //       gas: web3.utils.toHex(10000000),
  //       dependsOn: null,
  //       nonce: '0xf2ed7cd2567c7cc5',
  //       reserved: {
  //         features: 1
  //       }
  //     })
  //     const hash = delegated.signingHash()


  //     const rawTx = getRawDelegatorTx(transaction)
  //     const sig = Buffer.concat([
  //       secp256k1.sign(hash, priv1),
  //       Buffer.from(handleHex(signedTx), 'hex')
  //     ])
  //     rawTx.push(sig)
  //     const rawData = rlp.encode(rawTx)
  //     console.log("rawData to sync-testnet", '0x' + rawData.toString('hex'))

  //     // Submit the raw transaction by hand to the test-net.
  //     const url = 'https://sync-testnet.vechain.org/transactions'
  //     fetch(url, {
  //       method: 'POST',
  //       headers: {
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({ 'raw': '0x' + rawData.toString('hex') })
  //     }).then(response => {
  //       response.text().then(r => { console.log(r) })
  //     }).catch(err => {
  //       console.log('err', err)
  //     })

  //     return signedTx;
  //   }, props).then(setSignedVIP191TransactionDelegator);
  // };

  const signCertificate = () => {
    useRequest(async () => {
      const certificate = {
        purpose: 'identification',
        payload: {
          type: 'text',
          content: content
        },
        domain: 'localhost',
        timestamp: 1545035330,
        signer: address
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const signCertData = {
        transport,
        appPrivateKey,
        certificate,
        appId,
        addressIndex: 0,
      }
      console.log("signTsignCertDataxData: ", { signCertData });

      const signedTx = await temp.signCertificate(signCertData);

      const siginingHex = getCertificateHex(certificate)
      const signingHash = blake2b(32).update(Buffer.from(siginingHex, 'hex')).digest()

      const sig = Buffer.from(signedTx.slice(2), 'hex')
      const recovery = sig[64]
      const r = sig.slice(0, 32)
      const s = sig.slice(32, 64)

      const pubKey = Buffer.from(ec.recoverPubKey(
        signingHash, 
        {r, s},
        recovery
      ).encode('array', false))

      const addr = '0x' + Buffer.from(createKeccakHash('keccak256').update(pubKey.slice(1)).digest()).slice(12).toString('hex')
      console.log("addr", addr)
      console.log("signer", certificate.signer)
      if (addr == safeToLowerCase(certificate.signer)) {
        console.log("verify done");
      }

      // console.log("verify: ", Certificate.verify({...certificate, signature: signedTx}))

      return signedTx;
    }, props).then(setSignedCertificate);
  }

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
        title='Sign VIP191 Transaction Origin (user)'
        content={signedVIP191TransactionOrigin}
        onClick={signVIP191TransactionOrigin}
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

      {/* <OneInput
        title='Sign VIP191 Transaction Delegator (sponsor)'
        content={signedVIP191TransactionDelegator}
        onClick={signVIP191TransactionDelegator}
        disabled={disabled}
        btnName='Sign'
        value={delegatorFor}
        setValue={setDelegatorFor}
        placeholder='delegatorFor'
        inputSize={3}
      /> */}

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
    </Container>
  );
}

export default CoinVet;