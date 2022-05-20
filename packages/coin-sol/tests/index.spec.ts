import crypto from 'node:crypto';
import * as bip39 from 'bip39';
import base58 from 'bs58';
import { Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import { Keypair, Transaction, SystemProgram, PublicKey, StakeProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import SOL, { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../src';
import * as stringUtil from '../src/utils/stringUtil';
import { TOKEN_INFO } from '../src/config/tokenInfos';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const sol = new SOL();

const mnemonic = bip39.generateMnemonic();

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
  let sdkWallet: Keypair = null;

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
    expect(walletAddress).toEqual(sdkWallet.publicKey.toString());
  });

  it('Test Get Token Address', async () => {
    const fromPubkey = getRandWallet();
    const token = getRandWallet();
    const [result] = sol.findProgramAddress(
      [base58.decode(fromPubkey), TOKEN_PROGRAM_ID, base58.decode(token)],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const [expected] = PublicKey.findProgramAddressSync(
      [base58.decode(fromPubkey), TOKEN_PROGRAM_ID, base58.decode(token)],
      new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
    );
    expect(result).toEqual(expected.toString());
  });

  it('Test Normal Transfer', async () => {
    const toPubkey = getRandWallet();
    const recentBlockhash = getRandWallet();
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        toPubkey,
        recentBlockhash,
        lamports,
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
        toPubkey: new PublicKey(toPubkey),
        lamports,
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
      .addressPage(toPubkey)
      .amountPage(+lamports / LAMPORTS_PER_SOL)
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
    const amount = getRandInt(10 * 10 ** tokenInfo.decimals) + 1;

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
      amount
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
      .wrapPage('SOL', 'SPL')
      .messagePage('@' + tokenInfo.symbol)
      .addressPage(toTokenAccount)
      .amountPage(amount / 10 ** tokenInfo.decimals)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Delegate', async () => {
    const FROM_PUBKEY = sdkWallet.publicKey;
    const recentBlockhash = getRandWallet();
    const SEED = 'stake:0';
    const STAKE_ACCOUNT = await PublicKey.createWithSeed(FROM_PUBKEY, SEED, StakeProgram.programId);
    const VALIDATOR = new PublicKey(getRandWallet());
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        authorizedPubkey: FROM_PUBKEY.toString(),
        stakePubkey: STAKE_ACCOUNT.toString(),
        votePubkey: VALIDATOR.toString(),
        recentBlockhash,
      },
      addressIndex: 0,
    };
    const signedTx = await sol.signDelegate(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = StakeProgram.delegate({
      stakePubkey: STAKE_ACCOUNT,
      authorizedPubkey: FROM_PUBKEY,
      votePubkey: VALIDATOR,
    });
    sdkTransaction.feePayer = FROM_PUBKEY;
    sdkTransaction.recentBlockhash = recentBlockhash;
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(FROM_PUBKEY, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Delegate', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('STAKE')
      .addressPage(VALIDATOR.toBase58())
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Undelegate', async () => {
    const FROM_PUBKEY = sdkWallet.publicKey;
    const recentBlockhash = getRandWallet();
    const SEED = 'stake:0';
    const STAKE_ACCOUNT = await sol.createWithSeed(FROM_PUBKEY.toString(), SEED, StakeProgram.programId.toString());
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        stakePubkey: STAKE_ACCOUNT.toString(),
        authorizedPubkey: walletAddress,
        recentBlockhash,
      },
      addressIndex: 0,
    };
    const signedTx = await sol.signUndelegate(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
    const sdkTransaction = new Transaction({
      feePayer: sdkWallet.publicKey,
      recentBlockhash,
    }).add(
      StakeProgram.deactivate({
        authorizedPubkey: new PublicKey(walletAddress),
        stakePubkey: new PublicKey(STAKE_ACCOUNT),
      })
    );
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Undelegate params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('UnDel')
      .addressPage(walletAddress)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Delegate And CreateAccountWithSeed', async () => {
    const FROM_PUBKEY = sdkWallet.publicKey;
    const recentBlockhash = getRandWallet();
    const SEED = 'stake:0';
    const STAKE_ACCOUNT = await sol.createWithSeed(FROM_PUBKEY.toString(), SEED, StakeProgram.programId.toString());
    const VALIDATOR = new PublicKey(getRandWallet());
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;
    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        newAccountPubkey: STAKE_ACCOUNT,
        basePubkey: walletAddress,
        seed: SEED,
        votePubkey: VALIDATOR.toString(),
        lamports,
        recentBlockhash,
      },
      addressIndex: 0,
    };
    const signedTx = await sol.signDelegateAndCreateAccountWithSeed(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
    const sdkTransaction = StakeProgram.createAccountWithSeed({
      fromPubkey: FROM_PUBKEY,
      stakePubkey: new PublicKey(STAKE_ACCOUNT),
      basePubkey: FROM_PUBKEY,
      seed: SEED,
      authorized: {
        staker: FROM_PUBKEY,
        withdrawer: FROM_PUBKEY,
      },
      lamports,
    });
    sdkTransaction.feePayer = FROM_PUBKEY;
    sdkTransaction.recentBlockhash = recentBlockhash;

    const [delegateInstruction] = StakeProgram.delegate({
      stakePubkey: new PublicKey(STAKE_ACCOUNT),
      authorizedPubkey: FROM_PUBKEY,
      votePubkey: VALIDATOR,
    }).instructions;
    sdkTransaction.add(delegateInstruction);
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(FROM_PUBKEY, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Delegate And CreateAccountWithSeed', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('STAKE')
      .addressPage(VALIDATOR.toBase58())
      .amountPage(+lamports / LAMPORTS_PER_SOL)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Normal Transfer With SignTransaction', async () => {
    const toPubkey = getRandWallet();
    const recentBlockhash = getRandWallet();
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        toPubkey,
        recentBlockhash,
        lamports,
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
        toPubkey: new PublicKey(toPubkey),
        lamports,
      })
    );
    const message = sdkTransaction.compileMessage();
    const expectedSigUint8Array = await node.sign(message.serialize().toString('hex'));
    sdkTransaction.addSignature(sdkWallet.publicKey, expectedSigUint8Array);

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(sdkTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(sdkTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Normal Transfer params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .addressPage(toPubkey)
      .amountPage(+lamports / LAMPORTS_PER_SOL)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Staking Withdraw with different toPubkey', async () => {
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;
    const recentBlockhash = getRandWallet();
    const stakePubkey = getRandWallet();
    const withdrawToPubKey = getRandWallet();

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        stakePubkey,
        withdrawToPubKey,
        recentBlockhash,
        lamports,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = StakeProgram.withdraw({
      authorizedPubkey: sdkWallet.publicKey,
      lamports,
      stakePubkey: new PublicKey(stakePubkey),
      toPubkey: new PublicKey(withdrawToPubKey),
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
    console.log(lamports / LAMPORTS_PER_SOL);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('Reward')
      .addressPage(withdrawToPubKey)
      .amountPage(+lamports / LAMPORTS_PER_SOL)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Staking Withdraw with Same toPubkey', async () => {
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;
    const recentBlockhash = getRandWallet();
    const stakePubkey = getRandWallet();
    const withdrawToPubKey = sdkWallet.publicKey;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        stakePubkey,
        withdrawToPubKey: withdrawToPubKey.toString(),
        recentBlockhash,
        lamports,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const sdkTransaction = StakeProgram.withdraw({
      authorizedPubkey: withdrawToPubKey,
      lamports,
      stakePubkey: new PublicKey(stakePubkey),
      toPubkey: withdrawToPubKey,
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
    console.log(lamports / LAMPORTS_PER_SOL);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage('Reward')
      .addressPage(withdrawToPubKey.toString())
      .amountPage(+lamports / LAMPORTS_PER_SOL)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });
});
