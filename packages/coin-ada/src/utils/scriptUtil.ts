import { utils, config } from '@coolwallet/core';
import { BigNumber } from '@ethersproject/bignumber';
import {
  MajorType,
  Integer,
  Output,
  ChangeOutput,
  TokenAsset,
  Witness,
  TxTypes,
  Transaction,
  MessageTransaction,
} from '../config/types';
import {
  TRANSFER,
  TOKEN_TRANSFER,
  TOKEN_TRANSFER_BLIND,
  REGISTER,
  REGISTER_AND_DELEGATE,
  DELEGATE,
  DEREGISTER,
  WITHDRAW,
  ABSTAIN,
  MESSAGE,
} from '../config/params';
import { TOKEN_TYPE } from '../config/tokenType';
import { derivePubKeyFromAccountToIndex, decodeAddress, cborEncode, genInputs, blake2b224 } from './index';
import { encodeOutputValue } from './transactionUtil';

const getFullPath = (rolePath: number, indexPath: number) => {
  const fullPath = utils.getFullPath({
    pathType: config.PathType.BIP32ED25519,
    pathString: `1852'/1815'/0'/${rolePath}/${indexPath}`,
  });
  return fullPath;
};

const getUintArgument = (value: Integer) => {
  const data = cborEncode(MajorType.Uint, value);
  const length = (data.length / 2 - 1).toString(16).padStart(2, '0');
  return length + data.padEnd(18, '0');
};

const getOutputArgument = (output: Output, isTestNet = false) => {
  const { addressBuff, addressEncodeType } = decodeAddress(output.address, isTestNet);
  const encodeType = addressEncodeType.toString(16).padStart(2, '0');
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');
  const amount = getUintArgument(output.amount);
  return encodeType + addressLength + address + amount;
};

// 2048 bytes of change value holds ~50 distinct-policy tokens (or ~250 sharing a policy) — enough
// to spend a token-heavy UTXO whose leftover tokens all ride back in one change output. It stays
// under Cardano's 5000-byte maxValueSize (a single output can't exceed that anyway).
const MAX_CHANGE_VALUE_BYTES = 2048;

// Unified change-output argument shared by every tx type: addressLength(1) + address(90) +
// valueLength(2) + value(2048). The value is a pre-encoded CBOR blob — a bare uint for an ADA-only
// change, or `82 <lovelace> <multiasset>` when the change carries native tokens. valueLength is 2
// bytes because the value can exceed 255. addressLength == 00 signals no change.
export const getChangeArgument = (output?: ChangeOutput, isTestNet = false) => {
  if (!output) return '00' + '0'.repeat(180) + '0000' + '0'.repeat(MAX_CHANGE_VALUE_BYTES * 2);

  const { addressBuff } = decodeAddress(output.address, isTestNet);
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');

  const valueHex = encodeOutputValue(output.amount, output.assets);
  const valueLengthBytes = valueHex.length / 2;
  if (valueLengthBytes > MAX_CHANGE_VALUE_BYTES) {
    throw new Error(`change value exceeds ${MAX_CHANGE_VALUE_BYTES} bytes (got ${valueLengthBytes})`);
  }

  const valueLength = valueLengthBytes.toString(16).padStart(4, '0');
  const valuePadded = valueHex.padEnd(MAX_CHANGE_VALUE_BYTES * 2, '0');

  return addressLength + address + valueLength + valuePadded;
};

// Token-info argument consumed by the token-transfer script: a fixed 72-byte payload
//   decimals(1) | symbolLength(1) | symbol(7) | policyId(28) | assetNameCborLength(1) | assetNameCbor(34)
// followed by the 72-byte CoolBitX-key signature over SHA256(payload). symbol and assetNameCbor sit
// in right-0-padded fixed slots; their real length is carried by the length fields. Display metadata
// (symbol/decimals/signature) comes from the official list for an official token, and from the
// caller for an unofficial one (which keeps an all-zero signature and is shown on the card as
// "@symbol").
const resolveTokenMeta = (token: TokenAsset): { symbol: string; decimals: number; signature: string } => {
  const official = TOKEN_TYPE.find(
    (t) =>
      t.policyId.toLowerCase() === token.policyId.toLowerCase() &&
      t.assetName.toLowerCase() === token.assetName.toLowerCase()
  );
  // The official list is authoritative for an official token: its symbol/decimals are exactly what
  // the official signature was produced over, so caller-supplied symbol/decimals are ignored here.
  // (A mismatch would not forge a trusted display anyway — it would only make the on-card signature
  // check fail and downgrade the token to "@symbol" — but keeping the trusted metadata avoids that
  // silent downgrade and any reliance on the card as the sole guard.)
  if (official) return { symbol: official.symbol, decimals: official.decimals, signature: official.signature };
  const { symbol, decimals } = token;
  if (symbol === undefined || decimals === undefined) {
    throw new Error('token symbol and decimals are required for an unofficial token');
  }
  return { symbol, decimals, signature: '' };
};

// The Pro SE cannot render a displayed integer >= 1e8, so such a transfer must be blind-signed. The
// displayed value is amount / 10^decimals, so this fires when amount >= 10^(8 + decimals).
const isTokenAmountBlind = (token: TokenAsset): boolean => {
  const { decimals } = resolveTokenMeta(token);
  return BigNumber.from(token.amount).gte(BigNumber.from(10).pow(8 + decimals));
};

// Precondition: the token has been validated by assertTokenTransferSupported (policyId/assetName/
// symbol/decimals bounds). This is a pure builder — it assumes valid, on-spec inputs.
export const getTokenInfoArgument = (token: TokenAsset): string => {
  const { symbol, decimals, signature } = resolveTokenMeta(token);
  const symbolBuff = Buffer.from(symbol, 'ascii');
  const nameBuff = Buffer.from(token.assetName, 'hex');

  const decimalsHex = decimals.toString(16).padStart(2, '0');
  const symbolLengthHex = symbolBuff.length.toString(16).padStart(2, '0');
  const symbolHex = symbolBuff.toString('hex').padEnd(14, '0');
  const assetNameCbor = cborEncode(MajorType.Byte, nameBuff.length) + token.assetName;
  const assetNameCborLengthHex = (assetNameCbor.length / 2).toString(16).padStart(2, '0');
  const assetNameCborPadded = assetNameCbor.padEnd(68, '0');

  const tokenInfo =
    decimalsHex + symbolLengthHex + symbolHex + token.policyId + assetNameCborLengthHex + assetNameCborPadded;
  return tokenInfo + signature.padStart(144, '0');
};

// Single entry guard for a token transfer, run before any card interaction and before any argument
// is built. It owns every token-field bound, so downstream builders (getTokenInfoArgument) can treat
// the token as valid. Rejects what the ledger or card can't honour:
//   - a missing token, or a Byron (legacy) receiver — which can't hold native tokens;
//   - a policyId that is not 28 bytes hex, or an assetName over 32 bytes (a Cardano ledger/consensus
//     cap — a longer name is rejected by the node regardless);
//   - a symbol outside 1..7 bytes — it sits in a fixed 7-byte payload slot, the official-token
//     convention shared with the other chains (e.g. ERC20/TRC20), bounded by the Pro screen;
//   - decimals outside 0..20 — it rides in one byte and the card renders the amount with it (on-card
//     range [0, 20]); >= 256 would even overflow its byte and shift the fixed-width payload;
//   - a non-positive amount (a zero-quantity asset is not a valid output), an amount passed as a JS
//     number too large to be exact (> 2^53 must be a string, else it is already corrupted here), or
//     an amount above Cardano's uint64 quantity cap (2^64 - 1, also the card's 8-byte amount slot).
export function assertTokenTransferSupported(
  output: Output,
  isTestNet = false
): asserts output is Output & { token: TokenAsset } {
  if (!output.token) throw new Error('output.token is required for a token transfer');
  const { addressEncodeType } = decodeAddress(output.address, isTestNet);
  if (addressEncodeType === 0) throw new Error('token transfer does not support Byron (legacy) addresses');

  const token = output.token;
  if (token.policyId.length !== 56) throw new Error('policyId must be 28 bytes hex');
  if (Buffer.from(token.assetName, 'hex').length > 32) throw new Error('assetName must be at most 32 bytes');

  // resolveTokenMeta also enforces that an unofficial token carries a caller-supplied symbol/decimals.
  const { symbol, decimals } = resolveTokenMeta(token);
  const symbolLength = Buffer.from(symbol, 'ascii').length;
  if (symbolLength < 1 || symbolLength > 7) throw new Error('token symbol must be 1 to 7 bytes');
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 20) {
    throw new Error('token decimals must be an integer between 0 and 20');
  }

  const { amount } = token;
  if (typeof amount === 'number' && !Number.isSafeInteger(amount)) {
    throw new Error('token amount exceeds safe integer range; pass large amounts as a string');
  }
  const amountBn = BigNumber.from(amount);
  if (amountBn.lte(0)) throw new Error('token amount must be greater than 0');
  if (amountBn.gt('18446744073709551615')) throw new Error('token amount must not exceed 2^64 - 1');
}

const getKeyHash = (keyHash?: string) => {
  if (!keyHash) throw new Error('keyHash is required');
  if (keyHash.length !== 56) throw new Error('keyHash length is invalid');
  return keyHash;
};

export const getScript = (txType: TxTypes, transaction?: Transaction): string => {
  if (txType === TxTypes.Transfer) return TRANSFER.scriptWithSignature;
  if (txType === TxTypes.TokenTransfer) {
    const token = transaction?.output?.token;
    return token && isTokenAmountBlind(token)
      ? TOKEN_TRANSFER_BLIND.scriptWithSignature
      : TOKEN_TRANSFER.scriptWithSignature;
  }
  if (txType === TxTypes.StakeRegister) return REGISTER.scriptWithSignature;
  if (txType === TxTypes.StakeRegisterAndDelegate) return REGISTER_AND_DELEGATE.scriptWithSignature;
  if (txType === TxTypes.StakeDelegate) return DELEGATE.scriptWithSignature;
  if (txType === TxTypes.StakeDeregister) return DEREGISTER.scriptWithSignature;
  if (txType === TxTypes.StakeWithdraw) return WITHDRAW.scriptWithSignature;
  if (txType === TxTypes.Abstain) return ABSTAIN.scriptWithSignature;
  if (txType === TxTypes.Message) return MESSAGE.scriptWithSignature;
  throw new Error('txType is not recognized');
};

export const getArguments = (
  transaction: Transaction,
  accPubKey: string,
  txType: TxTypes,
  isTestNet = false
): Witness[] => {
  const { addrIndexes, inputs, output, change, fee, ttl, poolKeyHash, withdrawAmount } = transaction;
  const accPubKeyBuff = Buffer.from(accPubKey, 'hex');
  const stakeKeyBuff = derivePubKeyFromAccountToIndex(accPubKeyBuff, 2, 0);
  const stakeKeyHash = blake2b224(stakeKeyBuff).toString('hex').padStart(56, '0');

  let argument = '';
  if (txType === TxTypes.Transfer) {
    if (!output) throw new Error('output is required');
    argument =
      getChangeArgument(change, isTestNet) +
      getOutputArgument(output, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      genInputs(inputs);
  }
  if (txType === TxTypes.TokenTransfer) {
    if (!output) throw new Error('output is required');
    assertTokenTransferSupported(output, isTestNet);
    argument =
      getChangeArgument(change, isTestNet) +
      getOutputArgument(output, isTestNet) + // receiver address + lovelace (output.amount)
      getTokenInfoArgument(output.token) +
      getUintArgument(output.token.amount) + // token amount
      getUintArgument(fee) +
      getUintArgument(ttl) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeRegister || txType === TxTypes.StakeDeregister || txType === TxTypes.Abstain) {
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeDelegate || txType === TxTypes.StakeRegisterAndDelegate) {
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      getKeyHash(poolKeyHash) +
      genInputs(inputs);
  }
  if (txType === TxTypes.StakeWithdraw) {
    if (!withdrawAmount) throw new Error('withdrawAmount is required');
    argument =
      getChangeArgument(change, isTestNet) +
      getUintArgument(fee) +
      getUintArgument(ttl) +
      getKeyHash(stakeKeyHash) +
      getUintArgument(withdrawAmount) +
      genInputs(inputs);
  }

  const witnesses = addrIndexes.map((addrIndex) => {
    const vkey = derivePubKeyFromAccountToIndex(accPubKeyBuff, 0, addrIndex).toString('hex');
    const sig = '';
    const fullPath = getFullPath(0, addrIndex);
    return { arg: `15${fullPath}${argument}`, vkey, sig };
  });

  // Token transfer, like the plain transfer, needs only payment-key witnesses (no stake key).
  if (txType === TxTypes.Transfer || txType === TxTypes.TokenTransfer) return witnesses;

  witnesses.push({
    arg: `15${getFullPath(2, 0)}${argument}`,
    vkey: stakeKeyBuff.toString('hex'),
    sig: '',
  });
  return witnesses;
};

export const getMessageArgument = (messageTransaction: MessageTransaction, isTestNet = false): string => {
  const { addrIndex, rolePath, receiveAddress, message } = messageTransaction;

  const { addressBuff } = decodeAddress(receiveAddress, isTestNet);
  const addressLength = addressBuff.length.toString(16).padStart(2, '0');
  const address = addressBuff.toString('hex').padEnd(180, '0');
  let argument = addressLength + address;

  const messageBuff = Buffer.from(message, 'utf8');
  const messageLength = messageBuff.length;
  const messagePrefix = cborEncode(MajorType.Byte, messageLength);
  argument += messagePrefix.padStart(6, '0') + messageBuff.toString('hex');

  const fullPath = getFullPath(rolePath, addrIndex);
  return `15${fullPath}${argument}`;
};
