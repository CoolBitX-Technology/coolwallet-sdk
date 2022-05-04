import { SignDataType } from '../config/types';
import { AuthInfo, SignerInfo, SimplePublicKey, ModeInfo, Coin, Fee, Msg, TxBody, Tx } from '../terra/@terra-core';

export async function genTERRASigFromSESig(canonicalSignature: { r: string; s: string }): Promise<string> {
  const { r } = canonicalSignature;
  const { s } = canonicalSignature;

  return Buffer.from(r + s, 'hex').toString('base64');
}

export function publicKeyToAddress(publicKeyHex: string) {
  const publicKey = Buffer.from(publicKeyHex, 'hex').toString('base64');
  return new SimplePublicKey(publicKey).address();
}

function createAuthInfo(publicKey: string, transaction: SignDataType['transaction']): AuthInfo {
  const signerInfo = new SignerInfo(
    new SimplePublicKey(Buffer.from(publicKey, 'hex').toString('base64')),
    +transaction.sequence,
    new ModeInfo(new ModeInfo.Single(ModeInfo.SignMode.SIGN_MODE_DIRECT))
  );
  const fee = new Fee(+transaction.fee.gas_limit, [new Coin(transaction.fee.denom.unit, +transaction.fee.amount)]);
  return new AuthInfo([signerInfo], fee);
}

export function createMsgTx(
  msgs: Msg[],
  transaction: SignDataType['transaction'],
  publicKey: string,
  signature: string
): Tx {
  const txBody = new TxBody(msgs, transaction.memo);
  const authInfo = createAuthInfo(publicKey, transaction);
  const tx = new Tx(txBody, authInfo, [signature]);
  return tx;
}
