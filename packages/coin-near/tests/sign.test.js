/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
// const coreModule = require('@coolwallet/core');

//import { createTransport } from '@coolwallet/transport-react-native-ble'
import { createTransport } from '@coolwallet/transport-web-ble';
import { Transport } from '@coolwallet/core';

let transport;

 const connect = async () => {
  WebBleTransport.listen(async (error, device) => {
      const cardName = device.name;
      transport = await WebBleTransport.connect(device);
      const SEPublicKey = await core.config.getSEPublicKey(transport)
      this.setState({ transport, cardName, SEPublicKey });
      localStorage.setItem('cardName', cardName)
      localStorage.setItem('SEPublicKey', SEPublicKey)
    });
  };
  //connect();

import * as nearAPI from 'near-api-js';
import NEAR from '../src';


const appId = 'Near test app';

const tstSender = 'alex_scn.testnet';
const tstReceiver = 'alex_scn2.testnet';
const tstAmount = '1.5';

// sets up a NEAR API/RPC provider to interact with the blockchain
const provider = new nearAPI.providers.JsonRpcProvider("https://rpc.testnet.near.org");

const appPrivateKey = '4X9hqNchzMzCi3Btjiss5swoMJrDeSorT8zMcqki6oZCCYX79tguTcBSoaLJCzM8YAa9whGZdcCrbzeLKFNffbd4';
const keyPair = nearAPI.utils.key_pair.KeyPairEd25519.fromString(appPrivateKey);

// gets sender's public key
const publicKey = keyPair.getPublicKey().toString();
debugger;
//class Transport {}

//const transport = new Transport();

const near = new NEAR(transport, appPrivateKey, appId);

//import { createTransport } from '@coolwallet/transport-web-ble';

// test('should get address ', async () => {
//   const address = await eth.getAddress(0);
//   expect(address).toBe('0xbAF99eD5b5663329FA417953007AFCC60f06F781');
// });

const mnemonic =
  'casino wait analyst employ same material anxiety gentle escape steel blush sheriff economy grit approve';


  //let transport: Transport;

  //beforeAll(async () => {
 //   const transport = await createTransport();
  //  props = await initialize(transport, mnemonic);
  //});

 test('should sign transaction ', async () => {
   // gets sender's public key information from NEAR blockchain
  //console.log(`access_key/${tstSender}/${publicKey}`);
  const accessKey = await provider.query(
    `access_key/${tstSender}/${publicKey}`, ''
  );
  //console.log(`access_key/${tstSender}/${publicKey}`);

  console.log('dsfdsfds');
  debugger;
    //const transport = await createTransport();
    debugger;

  const transaction = {
    sender: tstSender,
    publicKey: publicKey, 
    receiver: tstReceiver,
    nonce: ++accessKey.nonce,
    amount: tstAmount,
    recentBlockHash: accessKey.block_hash
  }

  const signTxData = {
    transport: transport,
    appPrivateKey: appPrivateKey,
    appId: appId,
    addressIndex: 0,
    transaction: transaction
  }

  const signature = await near.signTransaction(signTxData);

  // // 1) serialize the transaction in Borsh
  // const serializedTx = nearAPI.utils.serialize.serialize(
  //   nearAPI.transactions.SCHEMA, 
  //   transaction
  // );
  // // 2) hash the serialized transaction using sha256
  // const serializedTxHash = new Uint8Array(sha256.sha256.array(serializedTx));
  // // 3) create a signature using the hashed transaction
  // const signatureNear = keyPair.sign(serializedTxHash);

  console.log('--------------------------------------------------------------------------------------------');
  console.log(signature);
  console.log('--------------------------------------------------------------------------------------------');
  // console.log(signatureNear);
  // console.log('--------------------------------------------------------------------------------------------');
    expect(tx).toBe('0xf86d82031b84b2d05e0082520c940644de2a0cf3f11ef6ad89c264585406ea346a96880de0b6b3a76400008025a0ac1feeae6a0d9c0b6e23152432a270889495dcfc837db978f10000d38102be02a01570ac1cea178b10c2bc4d1693ba6599c80679eac83c2548234a3ad8e4f117a4');
 });

// test('should call old generation functions ', async () => {
//   expect(coreModule.core.flow.prepareSEData).toHaveBeenCalledTimes(1);
//   expect(coreModule.core.flow.sendDataToCoolWallet).toHaveBeenCalledTimes(1);
//   expect(coreModule.core.flow.sendScriptAndDataToCard).toHaveBeenCalledTimes(0);
// });
