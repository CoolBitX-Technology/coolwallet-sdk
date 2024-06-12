import { signTxType } from '../config/types';

function hasOwnProperty(o: Record<string, any>, prop: string) {
  return Object.prototype.hasOwnProperty.call(o, prop);
}

function isTransfer(p: signTxType) {
  const { transaction } = p;
  return hasOwnProperty(transaction, 'toPubkey') && hasOwnProperty(transaction, 'lamports');
}

function isTransferSPLToken(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'fromTokenAccount') &&
    hasOwnProperty(transaction, 'toTokenAccount') &&
    !hasOwnProperty(transaction, 'toPubkey') &&
    hasOwnProperty(transaction, 'amount')
  );
}

function isAssociateTokenAccount(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'owner') &&
    hasOwnProperty(transaction, 'associateAccount') &&
    hasOwnProperty(transaction, 'token')
  );
}

function isCreateAndTransferSPLToken(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'fromTokenAccount') &&
    hasOwnProperty(transaction, 'toPubkey') &&
    hasOwnProperty(transaction, 'toTokenAccount') &&
    hasOwnProperty(transaction, 'amount')
  );
}

function isDelegate(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'stakePubkey') &&
    hasOwnProperty(transaction, 'votePubkey') &&
    hasOwnProperty(transaction, 'authorizedPubkey')
  );
}

function isUndelegate(p: signTxType) {
  const { transaction } = p;
  return hasOwnProperty(transaction, 'stakePubkey') && hasOwnProperty(transaction, 'authorizedPubkey');
}

function isDelegateAndCreateAccountWithSeed(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'basePubkey') &&
    hasOwnProperty(transaction, 'votePubkey') &&
    hasOwnProperty(transaction, 'seed')
  );
}

function isStakingWithdraw(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'lamports') &&
    hasOwnProperty(transaction, 'stakePubkey') &&
    hasOwnProperty(transaction, 'withdrawToPubKey')
  );
}

export {
  isTransfer,
  isTransferSPLToken,
  isAssociateTokenAccount,
  isCreateAndTransferSPLToken,
  isDelegate,
  isDelegateAndCreateAccountWithSeed,
  isUndelegate,
  isStakingWithdraw,
};
