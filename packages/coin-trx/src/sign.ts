import { apdu, tx } from '@coolwallet/core';
import { sha256 } from './utils/cryptoUtil';

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec('secp256k1');

/**
 * @description convert int to varint
 * @param {number} int
 * @return {string}
 */
function toVarint(int: number) {
  const bytes = [];
  while (int > 0) {
    let out = int & 127;
    int = int >> 7;
    if (int > 0) out += 128;
    bytes.push([out]);
  }
  return Buffer.from(bytes).toString('hex');
}

/**
 * sign TRX Transaction
 * @param {Transport} transport
 * @param {string} appId
 * @param {String} appPrivateKey
 * @param {coinType} coinType
 * @param {{nonce:string, gasPrice:string, gasLimit:string, to:string,
 * value:string, data:string, chainId: number}} transaction
 * @param {Number} addressIndex
 * @param {String} publicKey
 * @param {Function} confirmCB
 * @param {Function} authorizedCB
 * @return {Promise<string>}
 */
export const signTransaction = async (
  signTxData: any,
  script: string,
  argument: string,
  publicKey: string
): Promise<string> => {
  const { transport, appPrivateKey, appId, confirmCB, authorizedCB } = signTxData;

  const preActions = [];
  const sendScript = async () => {
    await tx.command.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const action = async () => tx.command.executeScript(transport, appId, appPrivateKey, argument);

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWalletV2(
    transport,
    preActions,
    action,
    tx.SignatureType.Canonical,
    confirmCB,
    authorizedCB
  );

  if (Buffer.isBuffer(canonicalSignature)) return '';
  const { r, s } = canonicalSignature;
  const { signedTx } = await tx.command.getSignedHex(transport);
  const keyPair = ec.keyFromPublic(publicKey, 'hex');
  const v = ec.getKeyRecoveryParam(sha256(Buffer.from(signedTx, 'hex')), canonicalSignature, keyPair.pub);

  const sig = r + s + v.toString().padStart(2, '0');

  return '0a' + toVarint(signedTx.length / 2) + signedTx + '12' + toVarint(sig.length / 2) + sig;
};
