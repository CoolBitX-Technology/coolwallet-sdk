import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import web3 from 'web3';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';
import base58 from 'bs58';
import Template from '@coolwallet/template';
// import XLM from '../../../coin-xlm/src';

interface Props {
  transport: Transport | null,
  appPrivateKey: string,
  appPublicKey: string,
  isLocked: boolean,
  setIsLocked: (isLocked:boolean) => void,
}

function CoinTemplate(props: Props) {
  const temp = new Template();
  const [address, setAddress] = useState('');
  const [signedTransaction, setSignedTransaction] = useState('');
  const [value, setValue] = useState('0');
  const [to, setTo] = useState('28Ba9GWMXbiYndh5uVZXAJqsfZHCjvQYWTatNePUCE6x');

  const { transport, appPrivateKey } = props;
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
      const address = await temp.getAddress(transport!, appPrivateKey, appId, 0);
      // const address = await xlm.getAddress(transport, appPrivateKey, appId)
      return address;
    }, setAddress);
  };

  const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
  const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
  const handleHex = (hex: string | number) => evenHexDigit(removeHex0x(hex.toString()));
  const hex = "010001031398f62c6d1a457c51ba6a4b5f3dbd2f69fca93216218dc8997e416bd17d93cafd439fccb66727f289c5c6de3bc4a8fe5dd5d77770bc8ff15c3eeedcb14af3fc0000000000000000000000000000000000000000000000000000000000000000c49ae77603782054f17a9decea43b444eba0edb12c6f1d31c6e0e4a84bf052eb01020200010c020000003100000000000000"
  const signTransaction = async () => {
    handleState(async () => {
      const keys = Buffer.from([116,
        208,
        182,
        204,
        106,
        103,
        196,
        4,
        26,
        138,
        178,
        97,
        31,
        5,
        74,
        156,
        165,
        127,
        161,
        198,
        228,
        178,
        145,
        120,
        191,
        233,
        70,
        45,
        73,
        200,
        251,
        249,
        253,
        67,
        159,
        204,
        182,
        103,
        39,
        242,
        137,
        197,
        198,
        222,
        59,
        196,
        168,
        254,
        93,
        213,
        215,
        119,
        112,
        188,
        143,
        241,
        92,
        62,
        238,
        220,
        177,
        74,
        243,
        252,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,]).toString("hex")
      console.log("🚀 ~ file: index.tsx ~ line 155 ~ handleState ~ keys", keys.length)
      const recentBlockHash = Buffer.from([196,
        154,
        231,
        118,
        3,
        120,
        32,
        84,
        241,
        122,
        157,
        236,
        234,
        67,
        180,
        68,
        235,
        160,
        237,
        177,
        44,
        111,
        29,
        49,
        198,
        224,
        228,
        168,
        75,
        240,
        82,
        235]).toString("hex")
      console.log("🚀 ~ file: index.tsx ~ line 188 ~ handleState ~ recentBlockHash", recentBlockHash)
      const keyIndices = Buffer.from([0, 1]).toString("hex")
      console.log("🚀 ~ file: index.tsx ~ line 190 ~ handleState ~ keyIndices", keyIndices.length)
      const data = Buffer.from([2,
        0,
        0,
        0,
        49,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]).toString("hex")
      console.log("🚀 ~ file: index.tsx ~ line 204 ~ handleState ~ data", data)
      const transaction = {
<<<<<<< HEAD
        numberRequireSignature: "01",
        numberReadonlySignedAccount: "00",
        numberReadonlyUnSignedAccount: "01",
        keyCount: "03",
        keys,
        recentBlockHash,
        programIdIndex: 2,
        keyIndicesCount: 2,
        keyIndices,
        dataLength: "0c",
        data
=======
        chainId: 1,
        nonce: '0x289',
        gasPrice: '0x20c855800',
        gasLimit: '0x520c',
        to: to,
        value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),
        data: '',
>>>>>>> cb985746ed746a56527819366de80c8c053f0b6a
      };

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const script = '03000202C70700000001F5CAA0C70005CAACC7000505CAACC7000A05CAACC7000F02CAACC7001160CAAC570071CAAC170091CAAC170092CAAC170093CAACC7009402CAAC170096CAACC7009704DC07C003534F4CDDFC970023DAACC7C0970407D207CC05065052455353425554546F4E'
      
      const argument =
      handleHex(transaction.numberRequireSignature).padStart(10, "0") +
      handleHex(transaction.numberReadonlySignedAccount).padStart(10, "0") +
      handleHex(transaction.numberReadonlyUnSignedAccount).padStart(10, "0") +
      handleHex(transaction.keyCount).padStart(4, "0") +
      transaction.keys.padStart(192, "0") +
      transaction.recentBlockHash.padStart(32, "0") +
      handleHex("01").padStart(2, "0") +
      handleHex(transaction.programIdIndex).padStart(2, "0") +
      handleHex(transaction.keyIndicesCount).padStart(2, "0") +
      transaction.keyIndices.padStart(4, "0") +
      handleHex(transaction.dataLength).padStart(2, "0") +
      transaction.data.padStart(8, "0") 
      console.log("🚀 ~ file: index.tsx ~ line 236 ~ handleState ~  ",  transaction.data.padStart(24, "0"))
      
      console.log("🚀 ~ file: index.tsx ~ line 83 ~ handleState ~ argument", argument)
      const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction as any, script, argument);
      return signedTx;
    }, setSignedTransaction);
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
    </Container>
  );
}

export default CoinTemplate;