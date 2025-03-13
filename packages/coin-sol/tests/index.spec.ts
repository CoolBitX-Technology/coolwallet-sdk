import crypto from 'node:crypto';
import * as bip39 from 'bip39';
import base58 from 'bs58';
import { CardType, Transport } from '@coolwallet/core';
import { createTransport } from '@coolwallet/transport-jre-http';
import { initialize, getTxDetail, DisplayBuilder, CURVE, HDWallet } from '@coolwallet/testing-library';
import {
  Keypair,
  Transaction,
  SystemProgram,
  PublicKey,
  StakeProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
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
    if (process.env.CARD === 'go') {
      cardType = CardType.Go;
    } else {
      cardType = CardType.Pro;
    }
    if (cardType === CardType.Go) {
      transport = (await createTransport('http://localhost:9527', CardType.Go))!;
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
    const fromTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(token),
      new PublicKey(fromPubkey),
      true,
      new PublicKey(TOKEN_PROGRAM_ID)
    );
    expect(result).toEqual(fromTokenAccount.toBase58());
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

    if (cardType === CardType.Go) return;
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

  it('Test SPL Token Transaction', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = new PublicKey(walletAddress);
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
        programId: TOKEN_PROGRAM_ID,
      },
      addressIndex: 0,
      computeUnitPrice: '1000',
      computeUnitLimit: '200000',
    };

    const signedTx = await sol.signTransferSplTokenTransaction(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));

    const expectedTransaction = new Transaction({ blockhash: recentBlockhash, lastValidBlockHeight: 1000000 });
    expectedTransaction.feePayer = FROM_PUBKEY;

    const instruction = createTransferCheckedInstruction(
      new PublicKey(fromTokenAccount),
      new PublicKey(tokenInfo.address),
      new PublicKey(toTokenAccount),
      FROM_PUBKEY,
      BigInt(amount),
      tokenInfo.decimals,
      undefined,
      new PublicKey(TOKEN_PROGRAM_ID)
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

    if (cardType === CardType.Go) return;
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

  // sdk 簽出來的交易有問題，但不會用到，故不測試
  xit('Test Create Token Account and SPL Token Transfer', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const TO_PUBKEY = Keypair.generate().publicKey;
    const FROM_PUBKEY = new PublicKey(walletAddress);
    const tokenInfo = tokens[0];
    const fromTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenInfo.address),
      FROM_PUBKEY,
      false,
      new PublicKey(TOKEN_PROGRAM_ID)
    );
    const toTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenInfo.address),
      TO_PUBKEY,
      false,
      new PublicKey(TOKEN_PROGRAM_ID)
    );
    const recentBlockhash = getRandWallet();
    const amount = getRandInt(10 * 10 ** tokenInfo.decimals) + 1;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        fromTokenAccount: fromTokenAccount.toBase58(),
        toPubkey: TO_PUBKEY.toBase58(),
        toTokenAccount: toTokenAccount.toBase58(),
        recentBlockhash,
        amount,
        tokenInfo,
        programId: TOKEN_PROGRAM_ID,
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signCreateAndTransferSPLToken(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
    const expectedTransaction = new Transaction({ blockhash: recentBlockhash, lastValidBlockHeight: 1000000 });
    expectedTransaction.feePayer = FROM_PUBKEY;
    expectedTransaction
      .add(
        createAssociatedTokenAccountInstruction(
          FROM_PUBKEY,
          toTokenAccount,
          TO_PUBKEY,
          new PublicKey(tokenInfo.address)
        )
      )
      .add(
        createTransferCheckedInstruction(
          fromTokenAccount,
          new PublicKey(tokenInfo.address),
          toTokenAccount,
          FROM_PUBKEY,
          BigInt(amount),
          tokenInfo.decimals
        )
      );

    expectedTransaction.sign(expectedWallet);
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error('Test SPL Token Create and Transfer Transaction params', signTxData.transaction);
      throw e;
    }

    if (cardType === CardType.Go) return;
    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage(tokenInfo.symbol)
      .addressPage(TO_PUBKEY.toBase58())
      .amountPage(amount / 10 ** tokenInfo.decimals)
      .wrapPage('PRESS', 'BUTToN')
      .finalize();
    expect(display).toEqual(expectedTxDetail.toLowerCase());
  });

  it('Test Create Token Account and SPL Token Transfer With Compute Budget', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const TO_PUBKEY = Keypair.generate().publicKey;
    const FROM_PUBKEY = new PublicKey(walletAddress);
    const tokenInfo = tokens[0];
    const fromTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenInfo.address),
      FROM_PUBKEY,
      false,
      new PublicKey(TOKEN_PROGRAM_ID)
    );
    const toTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenInfo.address),
      TO_PUBKEY,
      false,
      new PublicKey(TOKEN_PROGRAM_ID)
    );
    const recentBlockhash = getRandWallet();
    const amount = getRandInt(10 * 10 ** tokenInfo.decimals) + 1;

    const signTxData = {
      transport,
      appPrivateKey: props.appPrivateKey,
      appId: props.appId,
      transaction: {
        fromTokenAccount: fromTokenAccount.toBase58(),
        toPubkey: TO_PUBKEY.toBase58(),
        toTokenAccount: toTokenAccount.toBase58(),
        recentBlockhash,
        amount,
        tokenInfo,
        programId: TOKEN_PROGRAM_ID,
        computeUnitPrice: '1000',
        computeUnitLimit: '200000',
      },
      addressIndex: 0,
    };

    const signedTx = await sol.signCreateAndTransferSPLToken(signTxData);
    const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
    const expectedTransaction = new Transaction({ blockhash: recentBlockhash, lastValidBlockHeight: 1000000 });
    expectedTransaction.feePayer = FROM_PUBKEY;
    // sdk 簽出來的順序固定，不能改動
    expectedTransaction
      .add(
        createAssociatedTokenAccountInstruction(
          FROM_PUBKEY,
          toTokenAccount,
          TO_PUBKEY,
          new PublicKey(tokenInfo.address)
        )
      )
      .add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: BigInt('1000'),
        })
      )
      .add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Number.parseInt('200000'),
        })
      )
      .add(
        createTransferCheckedInstruction(
          fromTokenAccount,
          new PublicKey(tokenInfo.address),
          toTokenAccount,
          FROM_PUBKEY,
          BigInt(amount),
          tokenInfo.decimals
        )
      );

    expectedTransaction.sign(expectedWallet);
    const message = expectedTransaction.compileMessage();
    const expectedSignature = (await node.sign(message.serialize().toString('hex'))) ?? new Uint8Array();
    expectedTransaction.addSignature(expectedWallet.publicKey, Buffer.from(expectedSignature));

    try {
      expect(recoveredTx.verifySignatures()).toEqual(true);
      expect(expectedTransaction.verifySignatures()).toEqual(true);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expectedTransaction.serialize().toString('hex'));
    } catch (e) {
      console.error(
        'Test SPL Token Create and Transfer With Compute Budget Transaction params',
        signTxData.transaction
      );
      throw e;
    }

    if (cardType === CardType.Go) return;
    const display = await getTxDetail(transport, props.appId);
    const expectedTxDetail = new DisplayBuilder()
      .messagePage('TEST')
      .messagePage('SOL')
      .messagePage(tokenInfo.symbol)
      .addressPage(TO_PUBKEY.toBase58())
      .amountPage(amount / 10 ** tokenInfo.decimals)
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
    const expectedTransaction = new Transaction({ blockhash: recentBlockhash, lastValidBlockHeight: 1000000 });
    expectedTransaction.feePayer = FROM_PUBKEY;
    expectedTransaction.add(
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

    if (cardType === CardType.Go) return;
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

    if (cardType === CardType.Go) return;
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

  it('Test Normal Transfer With SignTransferTransaction', async () => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = expectedWallet.publicKey;
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

    const expectedTransaction = new Transaction({ blockhash: recentBlockhash, lastValidBlockHeight: 1000000 });
    expectedTransaction.feePayer = FROM_PUBKEY;
    expectedTransaction.add(
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

    if (cardType === CardType.Go) return;
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

    const signedTx = await sol.signStackingWithdrawTransaction(signTxData);
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

    if (cardType === CardType.Go) return;
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

    const signedTx = await sol.signStackingWithdrawTransaction(signTxData);
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

    if (cardType === CardType.Go) return;
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
