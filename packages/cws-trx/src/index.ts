import {
	apdu,
	coin as COIN,
	transport as tp,
	error,
	tx,
} from '@coolwallet/core';
import * as trxSign from './sign';
import { SignTransactionData } from './config/type';
import * as scriptUtil from './utils/scriptUtils';
import * as trxUtil from './utils/trxUtils';
import * as scripts from './config/scripts';

type Transport = tp.default;

export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
	constructor() {
		super('C3');
	}

	/**
	 * Get Tron address by index
	 */
	async getAddress(
		transport: Transport,
		appPrivateKey: string,
		appId: string,
		addressIndex: number
	): Promise<string> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		return trxUtil.pubKeyToAddress(publicKey);
	}

	/**
	 * Sign Tron Transaction.
	 */
	async signTransaction(signTxData: SignTransactionData): Promise<string> {
		const {
			transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
		const rawPayload = trxUtil.getRawHex(transaction);

		const preActions = [];
		const sendScript = async () => {
			await apdu.tx.sendScript(transport, script);
		};
		preActions.push(sendScript);

		const action = async () => apdu.tx.executeScript(
			transport,
			appId,
			appPrivateKey,
			trxUtil.getArgument(signTxData)
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

		const { signedTx } = await apdu.tx.getSignedHex(transport);

		if (Buffer.isBuffer(canonicalSignature)) {
			throw new error.SDKError(this.signTransaction.name, 'canonicalSignature type error');
		}

		const { v, r, s } = await trxUtil.genTrxSigFromSESig(
			canonicalSignature,
			rawPayload,
			publicKey
		);
		const serializedTx = trxUtil.composeSignedTransacton(signTxData, v, r, s);
		return serializedTx;

		return trxSign.signTransaction(
			signTxData,
			script,
			publicKey,
		);
	}
}
