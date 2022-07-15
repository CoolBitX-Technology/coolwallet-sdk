import { getCoin } from './coin';
import { decodeBech32 } from './crypto';
import { THOR } from '../chain';
import { ChainProps } from '../chain/base';
import type { signMsgDelegate, signMsgSend, signMsgUndelegate, signMsgWithdrawDelegatorReward } from '../types';

function numberToHex(arg: number | string, length: number) {
  return Number(arg).toString(16).padStart(length, '0');
}

function getPath(coin_type: string, addressIndex: number) {
  const addressIdxHex = '00'.concat(addressIndex.toString(16).padStart(6, '0'));
  const SEPath = `15328000002C${coin_type}8000000000000000${addressIdxHex}`;
  console.debug('SEPath: ' + SEPath);
  return SEPath;
}

async function getMsgSendArgument(params: signMsgSend, chain: ChainProps, public_key: string): Promise<string> {
  const { transaction, addressIndex } = params;
  const coin = getCoin(chain, transaction.coin.denom);
  const fee = getCoin(chain, transaction.fee.denom);

  const path = getPath(chain.getCoinType(), addressIndex);

  const argPublicKey = public_key.padStart(66, '0');
  let argFrom = Buffer.from(transaction.fromAddress, 'ascii').toString('hex').padStart(128, '0');
  let argTo = Buffer.from(transaction.toAddress, 'ascii').toString('hex').padStart(128, '0');
  // ThorChain types.MsgSend encoded their from and to address in bytes form.
  if (chain.isChainId(THOR.getChainId())) {
    argFrom = decodeBech32(transaction.fromAddress).toString('hex').padStart(128, '0');
    argTo = decodeBech32(transaction.toAddress).toString('hex').padStart(128, '0');
  }
  const argAmount = numberToHex(transaction.coin.amount, 16);
  const argFeeAmount = numberToHex(transaction.fee.amount, 16);
  const argGas = numberToHex(transaction.fee.gas_limit, 16);
  const argAccountNumber = numberToHex(transaction.accountNumber, 16);
  const argSequence = numberToHex(transaction.sequence, 16);
  const argDenomInfo = coin.toHexCoinInfo();
  const argDenomSignature = coin.getSignature();
  const argFeeDenomInfo = fee.toHexCoinInfo();
  const argFeeDenomSignature = fee.getSignature();
  const argChainInfo = chain.toHexChainInfo();
  const argChainSignature = chain.getSignature();
  const argMemoLength = numberToHex(transaction.memo.length, 2);
  const argMemo = Buffer.from(transaction.memo, 'ascii').toString('hex').padEnd(254, '0');

  const args =
    argPublicKey +
    argFrom +
    argTo +
    argAmount +
    argFeeAmount +
    argGas +
    argAccountNumber +
    argSequence +
    argDenomInfo +
    argDenomSignature +
    argFeeDenomInfo +
    argFeeDenomSignature +
    argChainInfo +
    argChainSignature +
    argMemoLength +
    argMemo;

  return path + args;
}

async function getMsgDelegateArgument(params: signMsgDelegate, chain: ChainProps, public_key: string): Promise<string> {
  const { transaction, addressIndex } = params;
  const coin = getCoin(chain, transaction.coin.denom);
  const fee = getCoin(chain, transaction.fee.denom);

  const path = getPath(chain.getCoinType(), addressIndex);

  const argPublicKey = public_key.padStart(66, '0');
  const argFrom = Buffer.from(transaction.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argTo = Buffer.from(transaction.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argAmount = numberToHex(transaction.coin.amount, 16);
  const argFeeAmount = numberToHex(transaction.fee.amount, 16);
  const argGas = numberToHex(transaction.fee.gas_limit, 16);
  const argAccountNumber = numberToHex(transaction.accountNumber, 16);
  const argSequence = numberToHex(transaction.sequence, 16);
  const argDenomInfo = coin.toHexCoinInfo();
  const argDenomSignature = coin.getSignature();
  const argFeeDenomInfo = fee.toHexCoinInfo();
  const argFeeDenomSignature = fee.getSignature();
  const argChainInfo = chain.toHexChainInfo();
  const argChainSignature = chain.getSignature();
  const argMemoLength = numberToHex(transaction.memo.length, 2);
  const argMemo = Buffer.from(transaction.memo, 'ascii').toString('hex').padEnd(254, '0');

  const args =
    argPublicKey +
    argFrom +
    argTo +
    argAmount +
    argFeeAmount +
    argGas +
    argAccountNumber +
    argSequence +
    argDenomInfo +
    argDenomSignature +
    argFeeDenomInfo +
    argFeeDenomSignature +
    argChainInfo +
    argChainSignature +
    argMemoLength +
    argMemo;

  return path + args;
}

async function getMsgUndelegateArgument(
  params: signMsgUndelegate,
  chain: ChainProps,
  public_key: string
): Promise<string> {
  const { transaction, addressIndex } = params;
  const coin = getCoin(chain, transaction.coin.denom);
  const fee = getCoin(chain, transaction.fee.denom);

  const path = getPath(chain.getCoinType(), addressIndex);

  const argPublicKey = public_key.padStart(66, '0');
  const argFrom = Buffer.from(transaction.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argTo = Buffer.from(transaction.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argAmount = numberToHex(transaction.coin.amount, 16);
  const argFeeAmount = numberToHex(transaction.fee.amount, 16);
  const argGas = numberToHex(transaction.fee.gas_limit, 16);
  const argAccountNumber = numberToHex(transaction.accountNumber, 16);
  const argSequence = numberToHex(transaction.sequence, 16);
  const argDenomInfo = coin.toHexCoinInfo();
  const argDenomSignature = coin.getSignature();
  const argFeeDenomInfo = fee.toHexCoinInfo();
  const argFeeDenomSignature = fee.getSignature();
  const argChainInfo = chain.toHexChainInfo();
  const argChainSignature = chain.getSignature();
  const argMemoLength = numberToHex(transaction.memo.length, 2);
  const argMemo = Buffer.from(transaction.memo, 'ascii').toString('hex').padEnd(254, '0');

  const args =
    argPublicKey +
    argFrom +
    argTo +
    argAmount +
    argFeeAmount +
    argGas +
    argAccountNumber +
    argSequence +
    argDenomInfo +
    argDenomSignature +
    argFeeDenomInfo +
    argFeeDenomSignature +
    argChainInfo +
    argChainSignature +
    argMemoLength +
    argMemo;

  return path + args;
}

async function getMsgWithdrawDelegatorRewardArgument(
  params: signMsgWithdrawDelegatorReward,
  chain: ChainProps,
  public_key: string
): Promise<string> {
  const { transaction, addressIndex } = params;
  const coin = chain.getNativeCoin();
  const fee = getCoin(chain, transaction.fee.denom);

  const path = getPath(chain.getCoinType(), addressIndex);

  const argPublicKey = public_key.padStart(66, '0');
  const argFrom = Buffer.from(transaction.delegatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argTo = Buffer.from(transaction.validatorAddress, 'ascii').toString('hex').padStart(128, '0');
  const argAmount = numberToHex(0, 16);
  const argFeeAmount = numberToHex(transaction.fee.amount, 16);
  const argGas = numberToHex(transaction.fee.gas_limit, 16);
  const argAccountNumber = numberToHex(transaction.accountNumber, 16);
  const argSequence = numberToHex(transaction.sequence, 16);
  const argDenomInfo = coin.toHexCoinInfo();
  const argDenomSignature = coin.getSignature();
  const argFeeDenomInfo = fee.toHexCoinInfo();
  const argFeeDenomSignature = fee.getSignature();
  const argChainInfo = chain.toHexChainInfo();
  const argChainSignature = chain.getSignature();
  const argMemoLength = numberToHex(transaction.memo.length, 2);
  const argMemo = Buffer.from(transaction.memo, 'ascii').toString('hex').padEnd(254, '0');

  const args =
    argPublicKey +
    argFrom +
    argTo +
    argAmount +
    argFeeAmount +
    argGas +
    argAccountNumber +
    argSequence +
    argDenomInfo +
    argDenomSignature +
    argFeeDenomInfo +
    argFeeDenomSignature +
    argChainInfo +
    argChainSignature +
    argMemoLength +
    argMemo;

  return path + args;
}

export { getMsgSendArgument, getMsgDelegateArgument, getMsgUndelegateArgument, getMsgWithdrawDelegatorRewardArgument };
