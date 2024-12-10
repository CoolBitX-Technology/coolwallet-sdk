import { tx, apdu } from '@coolwallet/core';
import * as param from './config/param';
import { SignatureType } from '@coolwallet/core/lib/transaction';
import { getSmartContractArguments } from './utils/scriptUtil';
import { SmartTransactionArgs } from './config/types';
import { getPublicKey } from './utils/addressUtil';

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

  const publicKey = await getPublicKey(transport, appPrivateKey, appId, addressIndex);
  const eddsaType = '00';
  const signedTx = eddsaType + signatureHex + publicKey;
  return signedTx;
}
