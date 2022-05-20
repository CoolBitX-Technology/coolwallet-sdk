import { signTxType } from '../config/types';

function hasOwnProperty(o: Record<string, any>, prop: string) {
  return Object.prototype.hasOwnProperty.call(o, prop);
}

function isTransfer(p: signTxType) {
  const { transaction } = p;
  return hasOwnProperty(transaction, 'toPubKey') && hasOwnProperty(transaction, 'amount');
}

function isTransferSPLToken(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'fromTokenAccount') &&
    hasOwnProperty(transaction, 'toTokenAccount') &&
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

function isStakingWithdraw(p: signTxType) {
  const { transaction } = p;
  return (
    hasOwnProperty(transaction, 'amount') &&
    hasOwnProperty(transaction, 'stakePubkey') &&
    hasOwnProperty(transaction, 'withdrawToPubKey')
  );
}

export { isTransfer, isTransferSPLToken, isAssociateTokenAccount, isStakingWithdraw };
