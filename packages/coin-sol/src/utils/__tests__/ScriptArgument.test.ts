import base58 from 'bs58';
import { Keypair, PublicKey, SystemProgram, Transaction as Web3Transaction, TransactionMessage } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../../config/params';
import { VersionedMessage } from '../../message';
import { ScriptArgument, ScriptArgumentParams, ScriptArgumentType } from '../ScriptArgument';

jest.mock('@coolwallet/core', () => {
  return {
    utils: {
      getFullPath: jest.fn().mockReturnValue('108000002c800001f58000000080000000'),
    },
  };
});

const addressOf = (fill: number) => base58.encode(Buffer.alloc(32, fill));

describe('ScriptArgument.setRecentBlockhash', () => {
  const staleBlockhash = addressOf(1);
  const freshBlockhash = addressOf(2);
  const fromPubkey = '5kkqLZbsHMLbpMMSrzsHd4ssHtbxGyr7yPHfow8PdJnp';
  const addressIndex = 0;
  const tokenInfo = {
    symbol: 'USDT',
    decimals: 6,
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  };

  describe('compiled transactions', () => {
    const compiledCases: Array<{ name: string; paramsWith: (recentBlockhash: string) => ScriptArgumentParams }> = [
      {
        name: 'Transfer',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.Transfer,
          transaction: { toPubkey: addressOf(3), recentBlockhash, lamports: 1000 },
          fromPubkey,
          addressIndex,
        }),
      },
      {
        name: 'SplTokenTransfer',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.SplTokenTransfer,
          transaction: {
            fromTokenAccount: addressOf(3),
            toTokenAccount: addressOf(4),
            recentBlockhash,
            amount: 1000,
            tokenInfo,
            programId: TOKEN_PROGRAM_ID,
          },
          fromPubkey,
          tokenInfo,
          addressIndex,
        }),
      },
      {
        name: 'CreateAndTransferSplToken',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.CreateAndTransferSplToken,
          transaction: {
            fromTokenAccount: addressOf(3),
            toPubkey: addressOf(4),
            toTokenAccount: addressOf(5),
            recentBlockhash,
            amount: 1000,
            tokenInfo,
            programId: TOKEN_PROGRAM_ID,
          },
          fromPubkey,
          tokenInfo,
          addressIndex,
        }),
      },
      {
        name: 'Undelegate',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.Undelegate,
          transaction: { stakePubkey: addressOf(3), authorizedPubkey: fromPubkey, recentBlockhash },
          fromPubkey,
          addressIndex,
        }),
      },
      {
        name: 'DelegateAndCreateAccountWithSeed',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.DelegateAndCreateAccountWithSeed,
          transaction: { votePubkey: addressOf(3), seed: 'stake:0', lamports: 1000, recentBlockhash },
          fromPubkey,
          newAccountPubkey: addressOf(4),
          addressIndex,
        }),
      },
      {
        name: 'StakingWithdraw',
        paramsWith: (recentBlockhash) => ({
          txType: ScriptArgumentType.StakingWithdraw,
          transaction: { stakePubkey: addressOf(3), withdrawToPubKey: addressOf(4), recentBlockhash, lamports: 1000 },
          fromPubkey,
          addressIndex,
        }),
      },
    ];

    it.each(compiledCases)(
      '$name builds the same argument as a transaction that carried the fresh blockhash itself',
      ({ paramsWith }) => {
        const lateBound = new ScriptArgument(paramsWith(staleBlockhash));
        lateBound.setRecentBlockhash(freshBlockhash);

        const carriedFresh = new ScriptArgument(paramsWith(freshBlockhash));
        expect(lateBound.toArgument()).toEqual(carriedFresh.toArgument());
      }
    );

    it.each(compiledCases)("$name leaves the caller's transaction untouched", ({ paramsWith }) => {
      const params = paramsWith(staleBlockhash);
      const scriptArgument = new ScriptArgument(params);
      scriptArgument.setRecentBlockhash(freshBlockhash);
      scriptArgument.toArgument();

      expect('transaction' in params && params.transaction.recentBlockhash).toEqual(staleBlockhash);
    });
  });

  describe('versioned messages', () => {
    const payerKey = Keypair.fromSeed(Buffer.alloc(32, 9)).publicKey;
    const instructions = [
      SystemProgram.transfer({ fromPubkey: payerKey, toPubkey: new PublicKey(addressOf(3)), lamports: 1000 }),
    ];

    const messageCases: Array<{ name: string; messageWith: (recentBlockhash: string) => VersionedMessage }> = [
      {
        name: 'legacy',
        messageWith: (recentBlockhash) => {
          const legacyMessage = new Web3Transaction({ feePayer: payerKey, recentBlockhash })
            .add(...instructions)
            .compileMessage();
          return VersionedMessage.deserialize(Uint8Array.from(legacyMessage.serialize()));
        },
      },
      {
        name: 'v0',
        messageWith: (recentBlockhash) => {
          const v0Message = new TransactionMessage({ payerKey, recentBlockhash, instructions }).compileToV0Message();
          return VersionedMessage.deserialize(v0Message.serialize());
        },
      },
    ];

    it.each(messageCases)(
      '$name message is signed as if it had carried the fresh blockhash itself',
      ({ messageWith }) => {
        const lateBound = new ScriptArgument({
          txType: ScriptArgumentType.Versioned,
          transaction: messageWith(staleBlockhash),
          addressIndex,
        });
        lateBound.setRecentBlockhash(freshBlockhash);

        const carriedFresh = new ScriptArgument({
          txType: ScriptArgumentType.Versioned,
          transaction: messageWith(freshBlockhash),
          addressIndex,
        });
        expect(lateBound.toArgument()).toEqual(carriedFresh.toArgument());
        const broadcastMessage = (scriptArgument: ScriptArgument) =>
          (scriptArgument.toTransaction() as VersionedMessage).serialize();
        expect(broadcastMessage(lateBound)).toEqual(broadcastMessage(carriedFresh));
      }
    );

    it.each(messageCases)("$name message leaves the caller's message untouched", ({ messageWith }) => {
      const message = messageWith(staleBlockhash);
      const originalBytes = Buffer.from(message.serialize()).toString('hex');
      const scriptArgument = new ScriptArgument({
        txType: ScriptArgumentType.Versioned,
        transaction: message,
        addressIndex,
      });
      scriptArgument.setRecentBlockhash(freshBlockhash);
      scriptArgument.toArgument();

      expect(Buffer.from(message.serialize()).toString('hex')).toEqual(originalBytes);
      expect(scriptArgument.toTransaction()).not.toBe(message);
    });
  });

  describe('messages without a blockhash', () => {
    it.each`
      name             | params
      ${'SignMessage'} | ${{ txType: ScriptArgumentType.SignMessage, message: 'hello', addressIndex }}
      ${'SignIn'}      | ${{ txType: ScriptArgumentType.SignIn, message: { domain: 'coolwallet.io', address: fromPubkey }, addressIndex }}
    `('$name ignores the late-bound blockhash', ({ params }) => {
      const lateBound = new ScriptArgument(params);
      lateBound.setRecentBlockhash(freshBlockhash);

      expect(lateBound.toArgument()).toEqual(new ScriptArgument(params).toArgument());
    });
  });

  it('throws once the argument has been built', () => {
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.Transfer,
      transaction: { toPubkey: addressOf(3), recentBlockhash: staleBlockhash, lamports: 1000 },
      fromPubkey,
      addressIndex,
    });
    scriptArgument.toArgument();

    expect(() => scriptArgument.setRecentBlockhash(freshBlockhash)).toThrow('script argument is already built');
  });
});
