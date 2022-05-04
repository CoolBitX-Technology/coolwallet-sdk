import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import { Connection, Keypair, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import * as bip39 from 'bip39';
import SOL, { types, TransactionCreator } from '../src';
import * as params from '../src/config/params';
import * as stringUtil from '../src/utils/stringUtil';
import { TOKEN_INFO } from '../src/config/tokenInfos';

const crypto = require('crypto');

const logColor = (content: string, color = 32) => '\u001b[' + color + 'm' + content + '\u001b[0m';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const sol = new SOL();

const mnemonic =
  'across mask pet angle ginger frown fluid thunder join lawn topple lecture shell brown baby essence label survey ostrich canyon honey drip blush barely';

describe('Test Solana SDK', () => {
  const tokenArray = Object.values(TOKEN_INFO);
  const getRandInt = (max: number) => Math.floor(Math.random() * max);
  const getRandToken = () => tokenArray[getRandInt(tokenArray.length)];
  const getRandWallet = () => stringUtil.pubKeyToAddress(crypto.randomBytes(32).toString('hex'));

  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let walletAddress = '';
  let signTxData: types.signTxType = {
    confirmCB: undefined,
    authorizedCB: undefined,
  };

  const addressIndex = 0;
  const wallet = new HDWallet(CURVE.ED25519);
  let node = null;
  let sdkWallet = null;
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
    signTxData.transport = transport as Transport;
    signTxData.appPrivateKey = props.appPrivateKey;
    signTxData.appId = props.appId;
    const address = await sol.getAddress(transport, props.appPrivateKey, props.appId, 0);
    walletAddress = address;
    await wallet.setMnemonic(mnemonic);
    node = wallet.derivePath(`m/44'/501'/${addressIndex}'/0'`);
    sdkWallet = new Keypair({
      publicKey: new Uint8Array(await node.getPublicKey()),
      secretKey: new Uint8Array(node.privateKey),
    });
  });

  it('Test Get Address', async () => {
    const publicKey = await node.getPublicKey();
    expect(walletAddress).toEqual(stringUtil.pubKeyToAddress(publicKey.toString('hex')));
    expect(walletAddress).toEqual(sdkWallet.publicKey.toString('hex'));
  });

  it('Test Normal Transfer', async () => {
    const to = getRandWallet();
    const blockhash = getRandWallet();
    const value = (getRandInt(100) + 1) / 100.0;

    signTxData.transaction = TransactionCreator.transfer(walletAddress, to, blockhash, value.toString());
    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(signedTx);

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: sdkWallet.publicKey,
        toPubkey: new PublicKey(to),
        lamports: (value * params.LAMPORTS_PER_SOL).toString(),
      })
    );
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    try {
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Normal Transfer params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(SOL.name)
      .addressPage(to)
      .amountPage(+value)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Create Associate Account', async () => {
    const owner = getRandWallet();
    const associateAccount = getRandWallet();
    const token = getRandToken();
    const blockhash = getRandWallet();
    //const blockhash = (await connection.getRecentBlockhash()).blockhash;

    signTxData.transaction = TransactionCreator.createTokenAssociateAccount(
      walletAddress,
      owner,
      associateAccount,
      token.address,
      blockhash
    );
    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(signedTx);

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash: blockhash,
    });
    const instruction = createAssociatedTokenAccountInstruction(
      sdkWallet.publicKey,
      new PublicKey(associateAccount),
      new PublicKey(owner),
      new PublicKey(token.address)
    );
    sdkTransaction.instructions = [instruction];
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    //console.error(recoveredTx);
    //console.error(sdkTransaction);
    //console.error(recoveredTx.instructions[0]);
    //console.error(sdkTransaction.instructions[0]);
    //console.error(recoveredTx.instructions[0].keys);
    //console.error(sdkTransaction.instructions[0].keys);
    //console.error(recoveredTx._message);
    //console.error(message);

    //recoveredTx.instructions[0].keys.forEach(element => console.error("[rec]",element.pubkey.toString()));
    //sdkTransaction.instructions[0].keys.forEach(element => console.error("[sdk]",element.pubkey.toString()));

    // const result = await connection.sendRawTransaction(sdkTransaction.serialize());
    // console.error("Uplink:", result);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Create Associate Account params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage(SOL.name)
      .wrapPage('SMART', '')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test SPL Token Transaction', async () => {
    const fromTokenAccount = getRandWallet();
    const toTokenAccount = getRandWallet();
    const blockhash = getRandWallet();
    const token = getRandToken();
    const amount = getRandInt(10) + 1;
    
    signTxData.transaction = TransactionCreator.transferSplToken(
      walletAddress,
      fromTokenAccount,
      toTokenAccount,
      blockhash,
      amount.toString(),
      token
    );
    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(signedTx);

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash: blockhash,
    });
    const instruction = createTransferInstruction(
      new PublicKey(fromTokenAccount),
      new PublicKey(toTokenAccount),
      new PublicKey(walletAddress),
      amount * (10 ** token.decimals)
    );
    sdkTransaction.instructions = [instruction];
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test SPL Token Transaction params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .wrapPage(SOL.name, 'SPL')
      .messagePage('@'+token.symbol)
      .addressPage(toTokenAccount)
      .amountPage(+amount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test SPL Token Transaction', async () => {
  });
});
