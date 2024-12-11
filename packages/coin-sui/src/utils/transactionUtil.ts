import BigNumber from 'bignumber.js';
import { CoinTransactionInfo, TokenTransactionInfo } from '../config/types';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_DECIMALS } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export function getKeyPair(mnemonic: string, addressIndex: number) {
  return Ed25519Keypair.deriveKeypair(mnemonic, `m/44'/784'/0'/0'/${addressIndex}'`);
}

function convertToUnitAmount(humanAmount: string, decmials: number) {
  return new BigNumber(humanAmount).shiftedBy(decmials).toFixed();
}

export function getCoinTransaction(transactionInfo: CoinTransactionInfo, fromAddress: string) {
  const { toAddress, amount, gasPayment, gasPrice, gasBudget } = transactionInfo;
  const sendAmount = convertToUnitAmount(amount, SUI_DECIMALS);

  const tx = new Transaction();
  tx.setSender(fromAddress);
  tx.setGasBudget(new BigNumber(gasBudget).toNumber());
  tx.setGasPayment(gasPayment);
  tx.setGasPrice(new BigNumber(gasPrice).toNumber());

  const [coin] = tx.splitCoins(tx.gas, [sendAmount]);
  tx.transferObjects([coin], toAddress);
  return tx;
}

export function getTokenTransaction(transactionInfo: TokenTransactionInfo, fromAddress: string, decimals: number) {
  const { toAddress, amount, gasPayment, gasPrice, gasBudget, coinObjects } = transactionInfo;
  const sendAmount = convertToUnitAmount(amount, decimals);

  const tx = new Transaction();
  tx.setSender(fromAddress);
  tx.setGasBudget(new BigNumber(gasBudget).toNumber());
  tx.setGasPayment(gasPayment);
  tx.setGasPrice(new BigNumber(gasPrice).toNumber());

  if (coinObjects.length > 1) {
    // merge coins if have more than one coinObjects
    const destination = coinObjects[0];
    const sources = coinObjects.filter((object) => object.objectId !== destination.objectId);
    const sourcesRef = sources.map((source) => tx.objectRef(source));
    tx.mergeCoins(tx.objectRef(destination), sourcesRef);
  }
  // split
  const { digest, objectId, version } = coinObjects[0];
  const [coin] = tx.splitCoins(tx.objectRef({ digest, objectId, version }), [sendAmount]);
  tx.transferObjects([coin], toAddress);
  return tx;
}
