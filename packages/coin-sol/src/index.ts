import { coin as COIN, error as ERROR, Transport, utils } from '@coolwallet/core';
import { SDKError } from '@coolwallet/core/lib/error';
import { PathType } from '@coolwallet/core/lib/config';
import base58 from 'bs58';
import BN from 'bn.js';
import { sha256 } from 'js-sha256';
import * as types from './config/types';
import * as params from './config/params';
import * as stringUtil from './utils/stringUtil';
import * as scriptUtil from './utils/scriptUtil';
import * as sign from './sign';
import { TOKEN_INFO } from './config/tokenInfos';
import { createProgramAddressSync } from './utils/account';
import { is_on_curve } from './utils/ed25519';
import { VersionedTransaction } from './utils/versionedTransaction';
import { ScriptArgument, ScriptArgumentType } from './utils/ScriptArgument';

class Solana extends COIN.EDDSACoin implements COIN.Coin {
  constructor() {
    super(params.COIN_TYPE);
  }

  isValidPublicKey(publicKey: types.Address): boolean {
    let buffer: Buffer;
    if (typeof publicKey === 'string') {
      try {
        buffer = base58.decode(publicKey);
      } catch (e) {
        return false;
      }
    } else {
      buffer = publicKey;
    }
    const publicKeyBytes = new BN(buffer, 16).toArray(undefined, 32);
    return is_on_curve(publicKeyBytes) === 1;
  }

  async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number): Promise<string> {
    const path = utils.getFullPath({ pathType: PathType.SLIP0010, pathString: `44'/501'/${addressIndex}'/0'` });
    const publicKey = await COIN.getPublicKeyByPath(transport, appId, appPrivateKey, path);
    console.debug('Public Key:', publicKey);
    if (!publicKey) {
      throw new ERROR.SDKError(this.getAddress.name, 'public key is undefined');
    }
    return stringUtil.pubKeyToAddress(publicKey);
  }

  async createWithSeed(fromPublicKey: types.Address, seed: string, programId: types.Address): Promise<string> {
    const buffer = Buffer.concat([
      stringUtil.toBase58Buffer(fromPublicKey),
      Buffer.from(seed),
      stringUtil.toBase58Buffer(programId),
    ]);
    const hash = sha256.create();
    hash.update(buffer);
    return base58.encode(Buffer.from(hash.hex(), 'hex'));
  }

  findProgramAddress(seeds: Array<Buffer | Uint8Array>, programId: types.Address): [string, number] {
    let nonce = 255;
    let address;
    while (nonce !== 0) {
      try {
        const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
        address = createProgramAddressSync(seedsWithNonce, programId);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
        nonce -= 1;
        continue;
      }
      return [address, nonce];
    }
    throw new Error(`Unable to find a viable program address nonce`);
  }

  async signTransferTransaction(signTxData: types.signTransferTransactionType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script =
      transaction.computeUnitLimit && transaction.computeUnitPrice
        ? params.SCRIPT.TRANSFER_WITH_COMPUTE_BUDGET.scriptWithSignature
        : params.SCRIPT.TRANSFER.scriptWithSignature;

    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.Transfer,
      transaction,
      fromPubkey,
      addressIndex,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signTransferSplTokenTransaction(signTxData: types.signTransferSplTokenTransactionType): Promise<string> {
    const { transport, transaction, appPrivateKey, appId, addressIndex } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script =
      transaction.computeUnitLimit && transaction.computeUnitPrice
        ? params.SCRIPT.SPL_TOKEN_WITH_COMPUTE_BUDGET.scriptWithSignature
        : params.SCRIPT.SPL_TOKEN.scriptWithSignature;
    // If given token address can be found in official token list, use it instead of the user given one.
    const tokenInfo: types.TokenInfo =
      TOKEN_INFO.find((tok) => tok.address === transaction.tokenInfo.address) ?? transaction.tokenInfo;
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.SplTokenTransfer,
      transaction,
      fromPubkey,
      addressIndex,
      tokenInfo,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signCreateAndTransferSPLToken(signTxData: types.signCreateAndTransferSplTokenTransaction): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script =
      transaction.computeUnitLimit && transaction.computeUnitPrice
        ? params.SCRIPT.CREATE_AND_SPL_TOKEN_WITH_COMPUTE_BUDGET.scriptWithSignature
        : params.SCRIPT.CREATE_AND_SPL_TOKEN.scriptWithSignature;
    // If given token address can be found in official token list, use it instead of the user given one.
    const tokenInfo: types.TokenInfo =
      TOKEN_INFO.find((tok) => tok.address === transaction.tokenInfo.address) ?? transaction.tokenInfo;
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.CreateAndTransferSplToken,
      transaction,
      fromPubkey,
      addressIndex,
      tokenInfo,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signUndelegate(signTxData: types.signUndelegateType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.UNDELEGATE.scriptWithSignature;
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.Undelegate,
      transaction,
      fromPubkey,
      addressIndex,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signDelegateAndCreateAccountWithSeed(
    signTxData: types.signDelegateAndCreateAccountWithSeedType
  ): Promise<string> {
    if (signTxData.transaction.seed.length > 64) {
      throw new SDKError(this.signDelegateAndCreateAccountWithSeed.name, 'seed length cannot be greater than 32 bytes');
    }
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.DELEGATE_AND_CREATE_ACCOUNT_WITH_SEED.scriptWithSignature;
    let newAccountPubkey = signTxData.transaction.newAccountPubkey;
    if (!newAccountPubkey) {
      newAccountPubkey = await this.createWithSeed(fromPubkey, signTxData.transaction.seed, params.STAKE_PROGRAM_ID);
    }
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.DelegateAndCreateAccountWithSeed,
      transaction,
      fromPubkey,
      newAccountPubkey,
      addressIndex,
    });

    return sign.signTransaction({ ...signTxData, transaction }, script, scriptArgument);
  }

  async signStackingWithdrawTransaction(signTxData: types.signStakingWithdrawType): Promise<string> {
    const { transport, appPrivateKey, appId, addressIndex, transaction } = signTxData;
    const fromPubkey = await this.getAddress(transport, appPrivateKey, appId, addressIndex);
    const script = params.SCRIPT.STAKING_WITHDRAW.scriptWithSignature;
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.StakingWithdraw,
      transaction,
      fromPubkey,
      addressIndex,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signSignInMessage(signMsgData: types.signSignInMessageType): Promise<string> {
    const { addressIndex } = signMsgData;
    const script = params.SCRIPT.SIGN_IN.scriptWithSignature;
    const message = signMsgData.message;
    const scriptArgument = new ScriptArgument({ txType: ScriptArgumentType.SignIn, message, addressIndex });

    return sign.signMessage(signMsgData, script, scriptArgument);
  }

  async signMessage(signMsgData: types.signMessageType): Promise<string> {
    const { addressIndex } = signMsgData;
    const script = params.SCRIPT.SIGN_MESSAGE.scriptWithSignature;
    const message = signMsgData.message;
    const scriptArgument = new ScriptArgument({ txType: ScriptArgumentType.SignMessage, message, addressIndex });

    return sign.signMessage(signMsgData, script, scriptArgument);
  }

  async signTransaction(signTxData: types.signVersionedTransactionType): Promise<string> {
    const { addressIndex } = signTxData;
    const script = params.SCRIPT.SMART_CONTRACT.scriptWithSignature;
    const scriptArgument = new ScriptArgument({
      txType: ScriptArgumentType.Versioned,
      transaction: signTxData.transaction.message,
      addressIndex,
    });

    return sign.signTransaction(signTxData, script, scriptArgument);
  }

  async signAllTransactions(signTxData: types.signVersionedTransactions): Promise<string[]> {
    const script = params.SCRIPT.SMART_CONTRACT.scriptWithSignature;
    const { preActions } = scriptUtil.getScriptSigningPreActions(signTxData, script);
    const scriptArguments = signTxData.transaction.map(
      ({ message }) =>
        new ScriptArgument({
          txType: ScriptArgumentType.Versioned,
          transaction: message,
          addressIndex: signTxData.addressIndex,
        })
    );

    const signatures = await sign.signAllTransactions(signTxData, preActions, scriptArguments);

    return signatures.map((signature, index) => {
      const _signatures = [];
      _signatures.push(signature);
      const messageSignatures = signTxData.transaction[index].signatures;
      for (let i = 1; i < messageSignatures.length; i++) {
        _signatures.push(messageSignatures[i]);
      }
      const versionedTransaction = new VersionedTransaction(signTxData.transaction[index].message, _signatures);
      return Buffer.from(versionedTransaction.serialize()).toString('hex');
    });
  }
}

export { types };
export {
  LAMPORTS_PER_SOL,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  STAKE_PROGRAM_ID,
  STAKE_CONFIG_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
} from './config/params';
export default Solana;
