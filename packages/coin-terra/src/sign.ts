import { tx, error } from '@coolwallet/core';
import * as types from './config/types';
import { AuthInfo, Fee, ModeInfo, Msg, SignerInfo, SimplePublicKey, Tx, TxBody } from './terra/@terra-core';
import * as txUtil from './utils/transactionUtils';
import { SignatureType } from '@coolwallet/core/lib/transaction';

async function signTransaction(
  signData: types.SignDataType,
  msgs: Msg | Msg[],
  script: string,
  argument: string,
  publicKey: string
): Promise<string> {
  const { transport, appId, appPrivateKey, confirmCB, authorizedCB, transaction } = signData;

  const preActions = [() => tx.command.sendScript(transport, script)];
  const action = () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.Canonical,
    confirmCB,
    authorizedCB
  );

  if (!Buffer.isBuffer(canonicalSignature)) {
    const terraSignature = await txUtil.genTERRASigFromSESig(canonicalSignature);
    const messages = Array.isArray(msgs) ? msgs : [msgs];
    const msgTx = txUtil.createMsgTx(messages, transaction, publicKey, terraSignature);
    return Buffer.from(msgTx.toBytes()).toString('base64');
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
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
    () => tx.command.sendScript(transport, script),
    () => tx.command.executeScript(transport, appId, appPrivateKey, argument),
  ];
  const action = () => tx.command.executeSegmentScript(transport, appId, appPrivateKey, txBodyHex);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    SignatureType.Canonical,
    confirmCB,
    authorizedCB
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
    const msgTx = new Tx(txBody, authInfo, [terraSignature]).toBytes();
    return Buffer.from(msgTx).toString('base64');
  } else {
    throw new error.SDKError(signTransaction.name, 'canonicalSignature type error');
  }
}

export { signTransaction, signSegmentTransaction };
