import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Transport, apdu, utils, config } from '@coolwallet/core';
import { NoInput, TwoInputs } from '../../../utils/componentMaker';
import base58 from 'bs58';
import Template from '@coolwallet/template';
// import XLM from '../../../coin-xlm/src';
import {
  Connection
} from "@solana/web3.js";

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
      const accExtKey = await temp.getAddress(transport!, appPrivateKey, appId, 2);
      console.log("🚀 ~ file: index.tsx ~ line 51 ~ handleState ~ accExtKey", accExtKey)
      // const address = await xlm.getAddress(transport, appPrivateKey, appId)
      return base58.encode(Buffer.from(accExtKey, "hex"));
    }, setAddress);
  };

  const evenHexDigit = (hex: string) => (hex.length % 2 !== 0 ? `0${hex}` : hex);
  const removeHex0x = (hex: string) => (hex.startsWith('0x') ? hex.slice(2) : hex);
  const handleHex = (hex: string | number) => evenHexDigit(removeHex0x(hex.toString()));
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");


  const signTransaction = async () => {
    handleState(async () => {
      const transaction = {
        numberRequireSignature: "01",
        numberReadonlySignedAccount: "00",
        numberReadonlyUnSignedAccount: "01",
        keyCount: "03",
        from: "8rzt5i6guiEgcRBgE5x5nmjPL97Ptcw76rnGTyehni7r",
        to: "D4Bo5ohVx9V7ZpY6xySTTohwBDXNqRXfrDsfP8abNfKJ",
        recentBlockHash: (await connection.getRecentBlockhash()).blockhash,
        // recentBlockHash: "AEx9iQxJ4yYMPg2VMwWZVduvhgTVQkpA6PVfFDVtPJis",
        programIdIndex: "02",
        keyIndicesCount: "02",
        keyIndices: "0001",
        dataLength: "0c",
        data: "020000008096980000000000",
      };
      console.log("🚀 ~ file: index.tsx ~ line 78 ~ handleState ~ transaction", transaction)

      const appId = localStorage.getItem('appId');
      if (!appId) throw new Error('No Appid stored, please register!');
      const script = '03000202C70700000001F5CAA01700CAA11700CAACD70002FFFFCAACD70003FFFFCAACD70004FFA0CAACD70064FFE0CAAC170084CAAC170085CAAC170086CAACC7008702CAACC7008902CAAC97008BDC07C003534F4CDDFC970008DAAC97C08B0CD207CC05065052455353425554546F4E'
      
      const getArgument = (transaction: any): string => {
        const keys = Buffer.concat([base58.decode(transaction.from), base58.decode(transaction.to), Buffer.alloc(32).fill(0)]).toString("hex")
        const recentBlockHash = base58.decode(transaction.recentBlockHash).toString("hex")
        
        const argument =
        handleHex(transaction.numberRequireSignature).padStart(2, "0") +
        handleHex(transaction.numberReadonlySignedAccount).padStart(2, "0") +
        handleHex(transaction.numberReadonlyUnSignedAccount).padStart(2, "0") +
        handleHex(transaction.keyCount).padStart(2, "0") +
        keys.padStart(192, "0") +
        recentBlockHash.padStart(64, "0") +
        handleHex("01").padStart(2, "0") +
        handleHex(transaction.programIdIndex).padStart(2, "0") +
        handleHex(transaction.keyIndicesCount).padStart(2, "0") +
        transaction.keyIndices.padStart(4, "0") +
        handleHex(transaction.dataLength).padStart(2, "0") +
        transaction.data.padStart(24, "0")

        return argument;
      }

      const argument = getArgument(transaction)
      
      
      console.log("🚀 ~ file: index.tsx ~ line 237 ~ handleState ~ argument", argument)
      const signedTx = await temp.signTransaction(transport!, appPrivateKey, appId, 0, transaction as any, script, argument);
      return signedTx;
      // return ""
    }, setSignedTransaction);
  };

  return (
    // @ts-ignore
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
