import crypto from 'node:crypto';
import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import { Keypair, Transaction, StakeProgram, SystemProgram, PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import SOL from '../src';
import * as params from '../src/config/params';
import * as stringUtil from '../src/utils/stringUtil';
import { TOKEN_INFO } from '../src/config/tokenInfos';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const sol = new SOL();

const mnemonic = `across mask pet angle ginger frown fluid thunder join lawn topple lecture shell brown baby essence label survey ostrich canyon honey drip blush barely`;

describe('Test Solana SDK', () => {
  const tokenArray = Object.values(TOKEN_INFO);
  const getRandInt = (max: number) => Math.floor(Math.random() * max);
  const getRandToken = () => tokenArray[getRandInt(tokenArray.length)];
  const getRandWallet = () => stringUtil.pubKeyToAddress(crypto.randomBytes(32).toString('hex'));

  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let walletAddress = '';

  const addressIndex = 0;
  const wallet = new HDWallet(CURVE.ED25519);
  let node = null;
  let sdkWallet = null;

  beforeAll(async () => {
    transport = (await createTransport())!;
    props = await initialize(transport, mnemonic);
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
    const toPubKey = getRandWallet();
    const recentBlockhash = getRandWallet();
    const amount = (getRandInt(10000000) + 1) / 10000000.0;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        toPubKey,
        recentBlockhash,
        amount,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransferTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: sdkWallet.publicKey,
        toPubkey: new PublicKey(toPubKey),
        lamports: amount * params.LAMPORTS_PER_SOL,
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
      .messagePage('SOL')
      .addressPage(toPubKey)
      .amountPage(+amount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Create Associate Account', async () => {
    const associateAccount = getRandWallet();
    const token = getRandToken();
    const recentBlockhash = getRandWallet();

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        owner: walletAddress,
        associateAccount,
        recentBlockhash,
        token: token.address,
      },
      addressIndex: 0,
    };
    const signedTx = await sol.signAssociateTokenAccount(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash,
    });
    const instruction = createAssociatedTokenAccountInstruction(
      sdkWallet.publicKey,
      new PublicKey(associateAccount),
      new PublicKey(sdkWallet.publicKey),
      new PublicKey(token.address)
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
      console.error('Test Create Associate Account params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .wrapPage('ToKEN', 'ACCoUNT')
      .addressPage(associateAccount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test SPL Token Transaction', async () => {
    const fromTokenAccount = getRandWallet();
    const toTokenAccount = getRandWallet();
    const recentBlockhash = getRandWallet();
    const tokenInfo = getRandToken();
    const amount = (getRandInt(1000000) + 1) / 1000000;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        walletAddress,
        fromTokenAccount,
        toTokenAccount,
        recentBlockhash,
        amount,
        tokenInfo,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransferSplTokenTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash,
    });
    const instruction = createTransferInstruction(
      new PublicKey(fromTokenAccount),
      new PublicKey(toTokenAccount),
      new PublicKey(walletAddress),
      amount * 10 ** tokenInfo.decimals
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

    console.error('Transaction:', sdkTransaction);

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .wrapPage('SOL', 'SPL')
      .messagePage('@' + tokenInfo.symbol)
      .addressPage(toTokenAccount)
      .amountPage(+amount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Normal Transfer With SignTransaction', async () => {
    const toPubKey = getRandWallet();
    const recentBlockhash = getRandWallet();
    const amount = (getRandInt(10000000) + 1) / 10000000.0;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        toPubKey,
        recentBlockhash,
        amount,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: sdkWallet.publicKey,
        toPubkey: new PublicKey(toPubKey),
        lamports: amount * params.LAMPORTS_PER_SOL,
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
      .messagePage('SOL')
      .addressPage(toPubKey)
      .amountPage(+amount)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Staking Withdraw', async () => {
    const amount = (getRandInt(10000000) + 1) / 10000000.0;
    const recentBlockhash = getRandWallet();
    const stakePubkey = getRandWallet();

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        stakePubkey,
        withdrawToPubKey: sdkWallet.publicKey,
        recentBlockhash,
        amount,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = StakeProgram.withdraw({
      authorizedPubkey: sdkWallet.publicKey,
      lamports: amount * params.LAMPORTS_PER_SOL,
      stakePubkey: new PublicKey(stakePubkey),
      toPubkey: sdkWallet.publicKey,
    });
    sdkTransaction.feePayer = sdkWallet.publicKey;
    sdkTransaction.recentBlockhash = recentBlockhash;
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Staking Withdraw params', signTxData.transaction);
      throw e;
    }
    
    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('Reward')
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });
});
