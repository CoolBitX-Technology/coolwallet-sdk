import crypto from 'node:crypto';
import { inspect } from 'node:util';
import * as bip39 from 'bip39';
import base58 from 'bs58';
import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import { Keypair, Transaction, SystemProgram, PublicKey, StakeProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import SOL, { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../src';
import * as stringUtil from '../src/utils/stringUtil';
import { TOKEN_INFO } from '../src/config/tokenInfos';

type PromiseValue<T> = T extends Promise<infer V> ? V : never;

const sol = new SOL();

const mnemonic = bip39.generateMnemonic();

function omit<T extends Record<string, any>>(obj: T, key: keyof T) {
  return Object.keys(obj).reduce((o, k) => {
    if (k === key) return o;
    return {
      ...o,
      [k]: obj[k],
    };
  }, {} as T);
}

describe('Test Solana SDK', () => {
  const tokens = Object.values(TOKEN_INFO);
  const getRandInt = (max: number) => Math.floor(Math.random() * max);
  const getRandToken = () => omit(tokens[getRandInt(tokens.length)], 'signature');
  const getRandWallet = () => stringUtil.pubKeyToAddress(crypto.randomBytes(32).toString('hex'));

  let props: PromiseValue<ReturnType<typeof initialize>>;
  let transport: Transport;
  let cardType: CardType;
  let walletAddress = '';

  const wallet = new HDWallet(CURVE.ED25519);
  const bip32Path = (addressIndex: number) => `m/44'/501'/${addressIndex}'/0'`;

  beforeAll(async () => {
    if (process.env.CARD === 'lite') {
      cardType = CardType.Lite;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Lite) {
      transport = (await createTransport('http://localhost:9527', CardType.Lite))!;
    } else {
      transport = (await createTransport())!;
    }
    props = await initialize(transport, mnemonic);
    const address = await sol.getAddress(transport, props.appPrivateKey, props.appId, 0);
    walletAddress = address;
    await wallet.setMnemonic(mnemonic);
  });

  it('Test Get Address', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expected = Keypair.fromSeed(node.privateKey);
    const publicKey = await node.getPublicKey();
    expect(walletAddress).toEqual(stringUtil.pubKeyToAddress(publicKey?.toString('hex') ?? ''));
    expect(walletAddress).toEqual(expected.publicKey.toString());
    expect(sol.isValidPublicKey(publicKey ?? '')).toBeTruthy();
    const token = getRandWallet();
    const [token_account] = sol.findProgramAddress(
      [publicKey!, TOKEN_PROGRAM_ID, base58.decode(token)],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    expect(sol.isValidPublicKey(token_account)).toBeFalsy();
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
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

    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: expectedWallet.publicKey,
        toPubkey: new PublicKey(toPubkey),
        lamports,
      })
    );
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
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

    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    });
    const instruction = createAssociatedTokenAccountInstruction(
      expectedWallet.publicKey,
      new PublicKey(associateAccount),
      new PublicKey(expectedWallet.publicKey),
      new PublicKey(token.address)
    );
    expectedTransaction.instructions = [instruction];
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
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

    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    });
    const instruction = createTransferInstruction(
      new PublicKey(fromTokenAccount),
      new PublicKey(toTokenAccount),
      new PublicKey(walletAddress),
      amount
    );
    expectedTransaction.instructions = [instruction];
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test SPL Token Transaction params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage(tokenInfo.symbol)
      .addressPage(toTokenAccount)
      .amountPage(amount / 10 ** tokenInfo.decimals)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Create Token Account and SPL Token Transfer', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = await node.getPublicKey();
    const TO_PUBKEY = getRandWallet();
    const tokenInfo = getRandToken();
    const [fromTokenAccount] = sol.findProgramAddress(
      [FROM_PUBKEY!, TOKEN_PROGRAM_ID, base58.decode(tokenInfo.address)],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const [toTokenAccount] = sol.findProgramAddress(
      [base58.decode(TO_PUBKEY), TOKEN_PROGRAM_ID, base58.decode(tokenInfo.address)],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const recentBlockhash = getRandWallet();
    const amount = getRandInt(10 * 10 ** tokenInfo.decimals) + 1;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        fromTokenAccount,
        toPubkey: TO_PUBKEY,
        toTokenAccount,
        recentBlockhash,
        amount,
        tokenInfo,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signCreateAndTransferSPLToken(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    })
      .add(
        createAssociatedTokenAccountInstruction(
          new PublicKey(FROM_PUBKEY!),
          new PublicKey(toTokenAccount),
          new PublicKey(TO_PUBKEY),
          new PublicKey(tokenInfo.address),
          new PublicKey(TOKEN_PROGRAM_ID),
          new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
        )
      )
      .add(
        createTransferInstruction(
          new PublicKey(fromTokenAccount),
          new PublicKey(toTokenAccount),
          new PublicKey(FROM_PUBKEY!),
          amount
        )
      );

    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error(
        'Expected Transaction:',
        inspect(expectedTransaction.compileMessage(), {
          showHidden: false,
          depth: null,
          colors: true,
        })
      );
      console.error(
        'Result Transaction:',
        inspect(recoveredTx.compileMessage(), {
          showHidden: false,
          depth: null,
          colors: true,
        })
      );
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage(tokenInfo.symbol)
      .addressPage(TO_PUBKEY)
      .amountPage(amount / 10 ** tokenInfo.decimals)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Delegate', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = expectedWallet.publicKey;
    const recentBlockhash = getRandWallet();
    const SEED = 'stake:0';
    const STAKE_ACCOUNT = await sol.createWithSeed(FROM_PUBKEY.toBuffer(), SEED, StakeProgram.programId.toBuffer());
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

    const expectedTransaction = StakeProgram.delegate({
      stakePubkey: new PublicKey(STAKE_ACCOUNT),
      authorizedPubkey: FROM_PUBKEY,
      votePubkey: VALIDATOR,
    });
    expectedTransaction.feePayer = FROM_PUBKEY;
    expectedTransaction.recentBlockhash = recentBlockhash;
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(FROM_PUBKEY, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = expectedWallet.publicKey;
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
    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    }).add(
      StakeProgram.deactivate({
        authorizedPubkey: new PublicKey(walletAddress),
        stakePubkey: new PublicKey(STAKE_ACCOUNT),
      })
    );
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = expectedWallet.publicKey;
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
    const expectedTransaction = StakeProgram.createAccountWithSeed({
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
    expectedTransaction.feePayer = FROM_PUBKEY;
    expectedTransaction.recentBlockhash = recentBlockhash;

    const [delegateInstruction] = StakeProgram.delegate({
      stakePubkey: new PublicKey(STAKE_ACCOUNT),
      authorizedPubkey: FROM_PUBKEY,
      votePubkey: VALIDATOR,
    }).instructions;
    expectedTransaction.add(delegateInstruction);
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(FROM_PUBKEY, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
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

    const expectedTransaction = new Transaction({
      feePayer: expectedWallet.publicKey,
      recentBlockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: expectedWallet.publicKey,
        toPubkey: new PublicKey(toPubkey),
        lamports,
      })
    );
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
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

    const expectedTransaction = StakeProgram.withdraw({
      authorizedPubkey: expectedWallet.publicKey,
      lamports,
      stakePubkey: new PublicKey(stakePubkey),
      toPubkey: new PublicKey(withdrawToPubKey),
    });
    expectedTransaction.feePayer = expectedWallet.publicKey;
    expectedTransaction.recentBlockhash = recentBlockhash;
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Staking Withdraw params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
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
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const lamports = ((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL;
    const recentBlockhash = getRandWallet();
    const stakePubkey = getRandWallet();
    const withdrawToPubKey = expectedWallet.publicKey;

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

    const expectedTransaction = StakeProgram.withdraw({
      authorizedPubkey: withdrawToPubKey,
      lamports,
      stakePubkey: new PublicKey(stakePubkey),
      toPubkey: withdrawToPubKey,
    });
    expectedTransaction.feePayer = expectedWallet.publicKey;
    expectedTransaction.recentBlockhash = recentBlockhash;
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test Staking Withdraw params', signTxData.transaction);
      throw e;
    }

    const display = await getTxDetail(transport, props.appId);
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
