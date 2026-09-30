import crypto from 'node:crypto';
import * as bip39 from 'bip39';
import base58 from 'bs58';
import { CardType, Transport, tx } from '@coolwallet/core';
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
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import SOL, { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../src';
import { VersionedMessage } from '../src/message';
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
    const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);

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

  it.each(tokens)('Test SPL Token Transaction $symbol', async (officialToken) => {
    const addressIndex = 0;
    const node = wallet.derivePath(bip32Path(addressIndex));
    const expectedWallet = Keypair.fromSeed(node.privateKey);
    const FROM_PUBKEY = new PublicKey(walletAddress);
    const fromTokenAccount = getRandWallet();
    const toTokenAccount = getRandWallet();
    const recentBlockhash = getRandWallet();
    // 不帶 signature，讓 SDK 依 token address 自行從官方清單取回官方簽名。
    // 官方簽名有效時 Pro 卡顯示純 symbol；簽名錯誤或缺漏才會退化成三條線。
    const tokenInfo = omit(officialToken, 'signature');
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

  it('Test Create Token Account and SPL Token Transfer', async () => {
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
      .addressPage(toTokenAccount.toBase58())
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
      .addressPage(toTokenAccount.toBase58())
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
    const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);
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
    const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);

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
    const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);
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
    const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);
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
  describe('Late-bound blockhash', () => {
    const addressIndex = 0;

    afterEach(() => {
      jest.restoreAllMocks();
    });

    /** Builds the transaction the card is expected to have signed, given the blockhash it used. */
    const expectedTransferTx = async (toPubkey: string, lamports: number, recentBlockhash: string) => {
      const node = wallet.derivePath(bip32Path(addressIndex));
      const expectedWallet = Keypair.fromSeed(node.privateKey);
      const transaction = new Transaction({ feePayer: expectedWallet.publicKey, recentBlockhash }).add(
        SystemProgram.transfer({
          fromPubkey: expectedWallet.publicKey,
          toPubkey: new PublicKey(toPubkey),
          lamports,
        })
      );
      const signature = (await node.sign(transaction.compileMessage().serialize().toString('hex'))) ?? new Uint8Array();
      transaction.addSignature(expectedWallet.publicKey, Buffer.from(signature));
      return transaction;
    };

    it('signs with the fetched blockhash, not the one carried by the transaction', async () => {
      const toPubkey = getRandWallet();
      const staleBlockhash = getRandWallet();
      const freshBlockhash = getRandWallet();
      const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);

      const signedTx = await sol.signTransferTransaction({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: { toPubkey, recentBlockhash: staleBlockhash, lamports },
        addressIndex,
        fetchBlockhash: async () => freshBlockhash,
      });

      const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
      expect(recoveredTx.recentBlockhash).toEqual(freshBlockhash);
      expect(recoveredTx.recentBlockhash).not.toEqual(staleBlockhash);
      expect(recoveredTx.verifySignatures()).toEqual(true);

      // The signature has to cover the fresh blockhash too, not just the serialized bytes
      const expected = await expectedTransferTx(toPubkey, lamports, freshBlockhash);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expected.serialize().toString('hex'));
    });

    it('keeps the transaction blockhash when no hook is given', async () => {
      const toPubkey = getRandWallet();
      const recentBlockhash = getRandWallet();
      const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);

      const signedTx = await sol.signTransferTransaction({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: { toPubkey, recentBlockhash, lamports },
        addressIndex,
      });

      const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
      expect(recoveredTx.recentBlockhash).toEqual(recentBlockhash);
      const expected = await expectedTransferTx(toPubkey, lamports, recentBlockhash);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expected.serialize().toString('hex'));
    });

    it('fetches the blockhash once, after the script is sent and before the argument is', async () => {
      const sendScript = jest.spyOn(tx.command, 'sendScript');
      const executeScript = jest.spyOn(tx.command, 'executeScript');
      const fetchBlockhash = jest.fn(async () => getRandWallet());

      await sol.signTransferTransaction({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: { toPubkey: getRandWallet(), recentBlockhash: getRandWallet(), lamports: 1000 },
        addressIndex,
        fetchBlockhash,
      });

      const [sendScriptOrder] = sendScript.mock.invocationCallOrder;
      const [fetchBlockhashOrder] = fetchBlockhash.mock.invocationCallOrder;
      const [executeScriptOrder] = executeScript.mock.invocationCallOrder;
      expect(fetchBlockhash).toHaveBeenCalledTimes(1);
      expect(sendScriptOrder).toBeLessThan(fetchBlockhashOrder);
      expect(fetchBlockhashOrder).toBeLessThan(executeScriptOrder);
    });

    it('rejects the whole signing attempt without sending the argument when the hook fails', async () => {
      const executeScript = jest.spyOn(tx.command, 'executeScript');

      const signing = sol.signTransferTransaction({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: { toPubkey: getRandWallet(), recentBlockhash: getRandWallet(), lamports: 1000 },
        addressIndex,
        fetchBlockhash: async () => {
          throw new Error('rpc is down');
        },
      });

      await expect(signing).rejects.toThrow('rpc is down');
      expect(executeScript).not.toHaveBeenCalled();
    });

    describe('every compiled entry point', () => {
      type FetchBlockhash = () => Promise<string>;
      const signingProps = (fetchBlockhash: FetchBlockhash) => ({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        addressIndex,
        fetchBlockhash,
      });

      const compiledEntryPoints = [
        {
          name: 'signTransferTransaction',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = { toPubkey: getRandWallet(), recentBlockhash, lamports: 1000 };
            return {
              transaction,
              signing: sol.signTransferTransaction({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
        {
          name: 'signTransferTransaction with compute budget',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = {
              toPubkey: getRandWallet(),
              recentBlockhash,
              lamports: 1000,
              computeUnitPrice: '1000',
              computeUnitLimit: '200000',
            };
            return {
              transaction,
              signing: sol.signTransferTransaction({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
        {
          name: 'signTransferSplTokenTransaction',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = {
              fromTokenAccount: getRandWallet(),
              toTokenAccount: getRandWallet(),
              recentBlockhash,
              amount: 1000,
              tokenInfo: tokens[0],
              programId: TOKEN_PROGRAM_ID,
            };
            return {
              transaction,
              signing: sol.signTransferSplTokenTransaction({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
        {
          name: 'signCreateAndTransferSPLToken',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = {
              fromTokenAccount: getRandWallet(),
              toPubkey: getRandWallet(),
              toTokenAccount: getRandWallet(),
              recentBlockhash,
              amount: 1000,
              tokenInfo: tokens[0],
              programId: TOKEN_PROGRAM_ID,
            };
            return {
              transaction,
              signing: sol.signCreateAndTransferSPLToken({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
        {
          name: 'signUndelegate',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = { stakePubkey: getRandWallet(), authorizedPubkey: walletAddress, recentBlockhash };
            return { transaction, signing: sol.signUndelegate({ ...signingProps(fetchBlockhash), transaction }) };
          },
        },
        {
          name: 'signDelegateAndCreateAccountWithSeed',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = { votePubkey: getRandWallet(), seed: 'stake:0', lamports: 1000, recentBlockhash };
            return {
              transaction,
              signing: sol.signDelegateAndCreateAccountWithSeed({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
        {
          name: 'signStackingWithdrawTransaction',
          sign: (recentBlockhash: string, fetchBlockhash: FetchBlockhash) => {
            const transaction = {
              stakePubkey: getRandWallet(),
              withdrawToPubKey: getRandWallet(),
              recentBlockhash,
              lamports: 1000,
            };
            return {
              transaction,
              signing: sol.signStackingWithdrawTransaction({ ...signingProps(fetchBlockhash), transaction }),
            };
          },
        },
      ];

      it.each(compiledEntryPoints)(
        "$name signs with the fetched blockhash and leaves the caller's transaction untouched",
        async ({ sign }) => {
          const staleBlockhash = getRandWallet();
          const freshBlockhash = getRandWallet();

          const { transaction, signing } = sign(staleBlockhash, async () => freshBlockhash);
          const recoveredTx = Transaction.from(Buffer.from(await signing, 'hex'));

          expect(recoveredTx.recentBlockhash).toEqual(freshBlockhash);
          expect(recoveredTx.verifySignatures()).toEqual(true);
          expect(transaction.recentBlockhash).toEqual(staleBlockhash);
        }
      );
    });

    it('applies the fetched blockhash to a versioned message, hex-encoded for legacy', async () => {
      const node = wallet.derivePath(bip32Path(addressIndex));
      const expectedWallet = Keypair.fromSeed(node.privateKey);
      const toPubkey = getRandWallet();
      const staleBlockhash = getRandWallet();
      const freshBlockhash = getRandWallet();
      const lamports = Math.round(((getRandInt(10000000) + 1) / 10000000.0) * LAMPORTS_PER_SOL);

      const legacyMessage = new Transaction({
        feePayer: expectedWallet.publicKey,
        recentBlockhash: staleBlockhash,
      })
        .add(
          SystemProgram.transfer({
            fromPubkey: expectedWallet.publicKey,
            toPubkey: new PublicKey(toPubkey),
            lamports,
          })
        )
        .compileMessage();

      const signedTx = await sol.signTransaction({
        transport,
        appPrivateKey: props.appPrivateKey,
        appId: props.appId,
        transaction: {
          signatures: [new Uint8Array(64)],
          message: VersionedMessage.deserialize(Uint8Array.from(legacyMessage.serialize())),
        },
        addressIndex,
        fetchBlockhash: async () => freshBlockhash,
      });

      const recoveredTx = Transaction.from(Buffer.from(signedTx, 'hex'));
      expect(recoveredTx.recentBlockhash).toEqual(freshBlockhash);
      expect(recoveredTx.verifySignatures()).toEqual(true);
      const expected = await expectedTransferTx(toPubkey, lamports, freshBlockhash);
      expect(recoveredTx.serialize().toString('hex')).toEqual(expected.serialize().toString('hex'));
    });

    describe('versioned messages', () => {
      const payerKey = () => Keypair.fromSeed(wallet.derivePath(bip32Path(addressIndex)).privateKey).publicKey;
      const transferInstructions = () => [
        SystemProgram.transfer({ fromPubkey: payerKey(), toPubkey: new PublicKey(getRandWallet()), lamports: 1000 }),
      ];

      const legacyMessageWith = (recentBlockhash: string) => {
        const legacyMessage = new Transaction({ feePayer: payerKey(), recentBlockhash })
          .add(...transferInstructions())
          .compileMessage();
        return VersionedMessage.deserialize(Uint8Array.from(legacyMessage.serialize()));
      };

      const v0MessageWith = (recentBlockhash: string) => {
        const v0Message = new TransactionMessage({
          payerKey: payerKey(),
          recentBlockhash,
          instructions: transferInstructions(),
        }).compileToV0Message();
        return VersionedMessage.deserialize(v0Message.serialize());
      };

      /** The card's signature has to cover exactly the message bytes that go out for broadcast. */
      const recoverSignedByCard = async (signedTx: string) => {
        const recoveredTx = VersionedTransaction.deserialize(Buffer.from(signedTx, 'hex'));
        const node = wallet.derivePath(bip32Path(addressIndex));
        const messageHex = Buffer.from(recoveredTx.message.serialize()).toString('hex');
        const expectedSignature = (await node.sign(messageHex)) ?? new Uint8Array();
        expect(Buffer.from(recoveredTx.signatures[0])).toEqual(Buffer.from(expectedSignature));
        return recoveredTx;
      };

      it("signTransaction applies the fetched blockhash to a v0 message, leaving the caller's untouched", async () => {
        const staleBlockhash = getRandWallet();
        const freshBlockhash = getRandWallet();
        const message = v0MessageWith(staleBlockhash);

        const signedTx = await sol.signTransaction({
          transport,
          appPrivateKey: props.appPrivateKey,
          appId: props.appId,
          transaction: { signatures: [new Uint8Array(64)], message },
          addressIndex,
          fetchBlockhash: async () => freshBlockhash,
        });

        const recoveredTx = await recoverSignedByCard(signedTx);
        expect(recoveredTx.version).toEqual(0);
        expect(recoveredTx.message.recentBlockhash).toEqual(freshBlockhash);
        expect(message.recentBlockhash).toEqual(staleBlockhash);
      });

      it('signAllTransactions fetches once and signs the whole batch with that blockhash', async () => {
        const staleBlockhash = getRandWallet();
        const freshBlockhash = getRandWallet();
        const messages = [legacyMessageWith(staleBlockhash), v0MessageWith(staleBlockhash)];
        const originalMessageBytes = messages.map((message) => Buffer.from(message.serialize()).toString('hex'));
        const fetchBlockhash = jest.fn(async () => freshBlockhash);

        const signedTxs = await sol.signAllTransactions({
          transport,
          appPrivateKey: props.appPrivateKey,
          appId: props.appId,
          transaction: messages.map((message) => ({ signatures: [new Uint8Array(64)], message })),
          addressIndex,
          fetchBlockhash,
        });

        const recoveredTxs = await Promise.all(signedTxs.map(recoverSignedByCard));
        expect(fetchBlockhash).toHaveBeenCalledTimes(1);
        expect(recoveredTxs.map((recoveredTx) => recoveredTx.version)).toEqual(['legacy', 0]);
        expect(recoveredTxs.map((recoveredTx) => recoveredTx.message.recentBlockhash)).toEqual([
          freshBlockhash,
          freshBlockhash,
        ]);
        expect(messages.map((message) => Buffer.from(message.serialize()).toString('hex'))).toEqual(
          originalMessageBytes
        );
      });

      it("signAllTransactions keeps each message's own blockhash when no hook is given", async () => {
        const blockhashes = [getRandWallet(), getRandWallet()];
        const messages = [legacyMessageWith(blockhashes[0]), v0MessageWith(blockhashes[1])];

        const signedTxs = await sol.signAllTransactions({
          transport,
          appPrivateKey: props.appPrivateKey,
          appId: props.appId,
          transaction: messages.map((message) => ({ signatures: [new Uint8Array(64)], message })),
          addressIndex,
        });

        const recoveredTxs = await Promise.all(signedTxs.map(recoverSignedByCard));
        expect(recoveredTxs.map((recoveredTx) => recoveredTx.message.recentBlockhash)).toEqual(blockhashes);
      });
    });
  });
});
