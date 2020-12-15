/* eslint-disable no-param-reassign */
import { coin as COIN, transport } from '@coolwallet/core';
import * as trxSign from './sign';
import { SignTransactionData } from './config/type';
import * as scriptUtil from './utils/scriptUtils';
import * as trxUtil from './utils/trxUtils';
import * as scripts from './config/scripts';

type Transport = transport.default;

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
			transport, appPrivateKey, appId, addressIndex
		} = signTxData;
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

		return trxSign.signTransaction(
			signTxData,
			script,
			publicKey,
		);
	}
}
