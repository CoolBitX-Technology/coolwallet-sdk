import {
	apdu,
	coin as COIN,
	transport as tp,
	error,
	tx,
} from '@coolwallet/core';
import * as trxSign from './sign';
import * as trxUtil from './utils/trxUtils';
import * as scripts from './config/scripts';
import * as type from './config/type';
import { TX_TYPE } from './config/type';
import * as param from './config/param';

export { TX_TYPE };


export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
	constructor() {
		super(param.coinType);
	}

	/**
	 * Get Tron address by index
	 */
	async getAddress(
		transport: type.Transport,
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
	async signTransaction(signTxData: type.SignTxData): Promise<{ r: string; s: string; } | Buffer>{
		
		const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
		const argement = trxUtil.getArgument(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}
}
