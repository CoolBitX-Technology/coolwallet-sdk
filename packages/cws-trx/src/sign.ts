import { apdu, transport, tx } from '@coolwallet/core';
import { sha256 } from './utils/cryptoUtil';

type Transport = transport.default;

const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ec = new elliptic.ec("secp256k1");

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
  const {
    transport, appPrivateKey, appId, confirmCB, authorizedCB
  } = signTxData;

  const preActions = [];
  const sendScript = async () => {
    await apdu.tx.sendScript(transport, script);
  };

  preActions.push(sendScript);

  const action = async () => apdu.tx.executeScript(
    transport,
    appId,
    appPrivateKey,
    argument
  );

  const canonicalSignature = await tx.flow.getSingleSignatureFromCoolWallet(
    transport,
    preActions,
    action,
    false,
    confirmCB,
    authorizedCB,
    true
  );

  if (Buffer.isBuffer(canonicalSignature)) return '';
	const { r, s } = canonicalSignature;
  const { signedTx } = await apdu.tx.getSignedHex(transport);
  const keyPair = ec.keyFromPublic(publicKey, "hex");
  const v = ec.getKeyRecoveryParam(
    sha256(Buffer.from(signedTx, 'hex')),
    canonicalSignature,
    keyPair.pub
  );

  const sig = r + s + v.toString().padStart(2, '0');

	return '0a' + toVarint(signedTx.length/2) + signedTx + '12' + toVarint(sig.length/2) + sig;
};

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
