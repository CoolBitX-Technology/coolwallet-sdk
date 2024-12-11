import { tx, apdu } from '@coolwallet/core';
import * as param from './config/param';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { getCoinTransferArguments, getSmartContractArguments, getTokenTransferArguments } from './utils/scriptUtil';
import { CoinTransactionArgs, SmartTransactionArgs, TokenTransactionArgs } from './config/types';
import { getPublicKey, getSuiAddressByPublicKey } from './utils/addressUtil';
import { getCoinTransaction, getTokenTransaction } from './utils/transactionUtil';
import { checkSmartTransaction, checkTransferTokenTransaction, checkTransferTransaction } from './utils/checkParams';

export async function signSmartTransaction(transactionArgs: SmartTransactionArgs): Promise<string> {
  const {
    transport,
    appId,
    appPrivateKey,
    addressIndex,
    transactionInfo: transaction,
    confirmCB,
    authorizedCB,
  } = transactionArgs;

  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const fromAddress = getSuiAddressByPublicKey(publicKey);

  checkSmartTransaction(transaction, fromAddress);

  const script = param.SCRIPT.SMART_CONTRACT.scriptWithSignature;
  const argument = await getSmartContractArguments(transaction, addressIndex);

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    confirmCB,
    authorizedCB,
    SignatureType.EDDSA
  );

  const signatureHex = signature.toString('hex');

  const eddsaType = '00';
  const signedTx = eddsaType + signatureHex + publicKey;
  return signedTx;
}

export async function signCoinTransferTransaction(transactionArgs: CoinTransactionArgs): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transactionInfo, confirmCB, authorizedCB } = transactionArgs;

  checkTransferTransaction(transactionInfo);

  const script = param.SCRIPT.TRANSFER.scriptWithSignature;
  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const fromAddress = getSuiAddressByPublicKey(publicKey);
  const transaction = getCoinTransaction(transactionInfo, fromAddress);
  const argument = await getCoinTransferArguments(transaction, addressIndex);

  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    confirmCB,
    authorizedCB,
    SignatureType.EDDSA
  );

  const signatureHex = signature.toString('hex');
  const eddsaType = '00';
  const signedTx = eddsaType + signatureHex + publicKey;
  return signedTx;
}

export async function signTokenTransferTransaction(transactionArgs: TokenTransactionArgs): Promise<string> {
  const { transport, appId, appPrivateKey, addressIndex, transactionInfo, tokenInfo, confirmCB, authorizedCB } =
    transactionArgs;

  checkTransferTokenTransaction(transactionInfo);

  const script = param.SCRIPT.TOKEN_TRANSFER.scriptWithSignature;
  // TODO: 若 token amount 大於特定數量就要改走 smart script
  checkTransferTokenTransaction(transactionInfo, tokenInfo);

  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const fromAddress = getSuiAddressByPublicKey(publicKey);
  console.log(`Token fromAddress= ${fromAddress}`);
  const { decimals } = tokenInfo;
  const transaction = getTokenTransaction(transactionInfo, fromAddress, decimals);

  const argument = await getTokenTransferArguments(transaction, addressIndex, tokenInfo);
  const preActions = [() => apdu.tx.sendScript(transport, script)];
  const action = () => apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const signature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    confirmCB,
    authorizedCB,
    SignatureType.EDDSA
  );

  const signatureHex = signature.toString('hex');

  const eddsaType = '00';
  const signedTx = eddsaType + signatureHex + publicKey;
  return signedTx;
}
