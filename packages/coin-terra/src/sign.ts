import * as core from '@coolwallet/core';
import * as types from './config/types';
import { AuthInfo, Fee, ModeInfo, Msg, SignerInfo, SimplePublicKey, Tx, TxBody } from './terra/@terra-core';
import * as txUtil from './utils/transactionUtils';

async function signTransaction(
  signData: types.SignDataType,
  msgs: Msg | Msg[],
  script: string,
  argument: string,
  publicKey: string
): Promise<string> {
  const { transport, appId, appPrivateKey, confirmCB, authorizedCB, transaction } = signData;

  const preActions = [() => core.apdu.tx.sendScript(transport, script)];
  const action = () => core.apdu.tx.executeScript(transport, appId, appPrivateKey, argument);

  const canonicalSignature = await core.tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const terraSignature = await txUtil.genTERRASigFromSESig(canonicalSignature);
    const messages = Array.isArray(msgs) ? msgs : [msgs];
    const tx = txUtil.createMsgTx(messages, transaction, publicKey, terraSignature);
    return Buffer.from(tx.toBytes()).toString('base64');
  } else {
    throw new core.error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
}

async function signSegmentTransaction(
  signData: types.SignMsgBlindType,
  txBodyHex: string,
  script: string,
  argument: string,
  publicKey: string
): Promise<string> {
  const { transport, appId, appPrivateKey, confirmCB, authorizedCB, transaction } = signData;
  const preActions = [
    () => core.apdu.tx.sendScript(transport, script),
    () => core.apdu.tx.executeScript(transport, appId, appPrivateKey, argument),
  ];
  const action = () => core.apdu.tx.executeSegmentScript(transport, appId, appPrivateKey, txBodyHex);

  const canonicalSignature = await core.tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const terraSignature = await txUtil.genTERRASigFromSESig(canonicalSignature);
    // Generate SignerInfo with publicKey, sequence
    const signerInfo = new SignerInfo(
      new SimplePublicKey(Buffer.from(publicKey, 'hex').toString('base64')),
      +transaction.sequence,
      new ModeInfo(new ModeInfo.Single(ModeInfo.SignMode.SIGN_MODE_DIRECT))
    );
    const fee = Fee.fromData(transaction.fee);
    // Generate AuthInfo
    const authInfo = new AuthInfo([signerInfo], fee);
    const txBody = TxBody.fromData({ messages: transaction.msgs, memo: transaction.memo });
    const tx = new Tx(txBody, authInfo, [terraSignature]).toBytes();
    return Buffer.from(tx).toString('base64');
  } else {
    throw new core.error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
}

export { signTransaction, signSegmentTransaction };
