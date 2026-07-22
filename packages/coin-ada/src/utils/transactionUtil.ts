import { derivePubKeyFromAccountToIndex, blake2b224, decodeAddress, cborEncode } from './index';
import {
  MajorType,
  Integer,
  Input,
  Output,
  ChangeOutput,
  TokenAsset,
  Witness,
  TxTypes,
  Transaction,
} from '../config/types';
import { assert } from './assert';

export const genInputs = (inputs: Input[]): string => {
  let result = '00' + cborEncode(MajorType.Array, inputs.length);
  for (const input of inputs) {
    const txId = input.txId.startsWith('0x') ? input.txId.substr(2) : input.txId;
    if (txId.length !== 64) throw new Error('txId length is invalid');
    result += '825820' + txId + cborEncode(MajorType.Uint, input.index);
  }
  return result;
};

const genOutputsPrefix = (output?: Output, change?: ChangeOutput) => {
  let outputCount = 0;
  if (output) outputCount += 1;
  if (change) outputCount += 1;
  return '01' + cborEncode(MajorType.Array, outputCount);
};

export const buildMultiAssetCbor = (assets: TokenAsset[]): string => {
  const policyMap = new Map<string, TokenAsset[]>();
  for (const asset of assets) {
    if (asset.policyId.length !== 56) throw new Error(`policyId must be 28 bytes hex: ${asset.policyId}`);
    if (!policyMap.has(asset.policyId)) policyMap.set(asset.policyId, []);
    const group = policyMap.get(asset.policyId);
    assert(group, `buildMultiAssetCbor: group must be in policyMap by policyId=${asset.policyId}`);
    group.push(asset);
  }

  // Cardano requires canonical CBOR: map keys sorted by encoded length, then bytewise.
  // The node rejects a non-canonical value, and the signature is over these exact bytes.
  // Compare by decoded bytes (not the hex string) so the order is independent of hex
  // casing: policy ids are all 28 bytes (bytewise); asset names vary, so byte length
  // first, then bytewise.
  const sortedPolicies = [...policyMap.keys()].sort((a, b) => Buffer.from(a, 'hex').compare(Buffer.from(b, 'hex')));

  let result = cborEncode(MajorType.Map, sortedPolicies.length);
  for (const policyId of sortedPolicies) {
    const group = policyMap.get(policyId);
    assert(group, `buildMultiAssetCbor: group must be in policyMap by policyId=${policyId}`);
    const policyAssets = [...group].sort((a, b) => {
      const nameA = Buffer.from(a.assetName, 'hex');
      const nameB = Buffer.from(b.assetName, 'hex');
      return nameA.length - nameB.length || nameA.compare(nameB);
    });
    result += cborEncode(MajorType.Byte, 28) + policyId;
    result += cborEncode(MajorType.Map, policyAssets.length);
    for (const asset of policyAssets) {
      const nameBuff = Buffer.from(asset.assetName, 'hex');
      result += cborEncode(MajorType.Byte, nameBuff.length) + asset.assetName;
      result += cborEncode(MajorType.Uint, asset.amount);
    }
  }
  return result;
};

export const encodeOutputValue = (amount: Integer, assets?: TokenAsset[]): string => {
  if (!assets || assets.length === 0) return cborEncode(MajorType.Uint, amount);
  return '82' + cborEncode(MajorType.Uint, amount) + buildMultiAssetCbor(assets);
};

// One output entry: 82 <addrHeader> <addr> <value>. `assets` folds into the value when present.
const genOutputEntry = (
  address: string,
  amount: Integer,
  assets: TokenAsset[] | undefined,
  isTestNet: boolean
): string => {
  const addressBuff = decodeAddress(address, isTestNet).addressBuff;
  return (
    '82' +
    cborEncode(MajorType.Byte, addressBuff.length) +
    addressBuff.toString('hex') +
    encodeOutputValue(amount, assets)
  );
};

// Receiver output. Carries a single native token when this is a token transfer, otherwise plain ADA.
export const genOutput = (output?: Output, isTestNet = false): string => {
  if (!output) return '';
  return genOutputEntry(output.address, output.amount, output.token ? [output.token] : undefined, isTestNet);
};

// Change output. Carries the leftover native tokens (if any) as `assets`.
export const genChange = (change?: ChangeOutput, isTestNet = false): string => {
  if (!change) return '';
  return genOutputEntry(change.address, change.amount, change.assets, isTestNet);
};

export const genFee = (value: Integer): string => {
  let result = '02';
  result += cborEncode(MajorType.Uint, value);
  return result;
};

export const genTtl = (value: Integer): string => {
  let result = '03';
  result += cborEncode(MajorType.Uint, value);
  return result;
};

export const genFakeWitness = (addressIndexes: number[], txType: TxTypes): string => {
  const isPaymentOnly = txType === TxTypes.Transfer || txType === TxTypes.TokenTransfer;
  const count = addressIndexes.length + (isPaymentOnly ? 0 : 1);
  let result = 'a100' + cborEncode(MajorType.Array, count);
  // for (const index of addressIndexes) {
  //   result += '825820' + '0'.repeat(64);
  //   result += '5840' + '0'.repeat(128);
  // }
  result += '0'.repeat(202 * count);
  return result;
};

export const genWitness = (witnesses: Witness[]): string => {
  let result = 'a100' + cborEncode(MajorType.Array, witnesses.length);
  for (const witness of witnesses) {
    const { vkey, sig } = witness;
    if (vkey.length !== 64) throw new Error('vkey length is invalid');
    if (sig.length !== 128) throw new Error('signature length is invalid');
    result += '825820' + vkey;
    result += '5840' + sig;
  }
  return result;
};

const genTxBodyPrefix = (txType: TxTypes) => {
  // Transfer and token transfer bodies are 4-entry maps (inputs, outputs, fee, ttl);
  // the staking/governance types add a 5th entry (certs / withdrawals).
  if (txType === TxTypes.Transfer || txType === TxTypes.TokenTransfer) return 'a4';
  return 'a5';
};

export const genFakeTxBody = (tx: Transaction, txType: TxTypes, isTestNet = false) => {
  let result = genTxBodyPrefix(txType);
  result += genInputs(tx.inputs);
  result += genOutputsPrefix(tx.output, tx.change);
  result += genOutput(tx.output, isTestNet);
  result += genChange(tx.change, isTestNet);
  result += genFee(tx.fee);
  result += genTtl(tx.ttl);

  if (txType === TxTypes.StakeRegister) result += '0'.repeat(72);
  if (txType === TxTypes.StakeRegisterAndDelegate) result += '0'.repeat(200);
  if (txType === TxTypes.StakeDeregister) result += '0'.repeat(72);
  if (txType === TxTypes.Abstain) result += '0'.repeat(82);
  if (txType === TxTypes.StakeDelegate) result += '0'.repeat(132);
  if (txType === TxTypes.StakeWithdraw) {
    if (!tx.withdrawAmount) throw new Error('withdrawAmount is required');
    result += '0'.repeat(66) + cborEncode(MajorType.Uint, tx.withdrawAmount);
  }

  return result;
};

export const genTxBody = (tx: Transaction, accPubKey: string, txType: TxTypes, isTestNet = false) => {
  let result = genTxBodyPrefix(txType);
  result += genInputs(tx.inputs);
  result += genOutputsPrefix(tx.output, tx.change);
  result += genOutput(tx.output, isTestNet);
  result += genChange(tx.change, isTestNet);
  result += genFee(tx.fee);
  result += genTtl(tx.ttl);

  if (txType === TxTypes.Transfer || txType === TxTypes.TokenTransfer) return result;

  const accPubKeyBuff = Buffer.from(accPubKey, 'hex');
  const stakeKeyBuff = derivePubKeyFromAccountToIndex(accPubKeyBuff, 2, 0);
  const stakeKeyHash = blake2b224(stakeKeyBuff).toString('hex').padStart(56, '0');

  if (txType === TxTypes.StakeRegister) result += '048182008200581c' + stakeKeyHash;
  if (txType === TxTypes.StakeDeregister) result += '048182018200581c' + stakeKeyHash;
  if (txType === TxTypes.Abstain) result += '04d901028183098200581c' + stakeKeyHash + '8102';

  if (txType === TxTypes.StakeDelegate) {
    if (!tx.poolKeyHash) throw new Error('poolKeyHash is required');
    result += '048183028200581c' + stakeKeyHash + '581c' + tx.poolKeyHash;
  }
  if (txType === TxTypes.StakeWithdraw) {
    if (!tx.withdrawAmount) throw new Error('withdrawAmount is required');
    result += '05a1581de1' + stakeKeyHash + cborEncode(MajorType.Uint, tx.withdrawAmount);
  }
  if (txType === TxTypes.StakeRegisterAndDelegate) {
    if (!tx.poolKeyHash) throw new Error('poolKeyHash is required');
    result += '048282008200581c' + stakeKeyHash;
    result += '83028200581c' + stakeKeyHash + '581c' + tx.poolKeyHash;
  }
  return result;
};
