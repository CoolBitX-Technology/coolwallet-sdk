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
	async signTransaction(signTxData: type.NormalTradeData): Promise<{ r: string; s: string; } | Buffer> {

		const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;
		const argement = trxUtil.getNormalTradeArgument(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}

	async signFreeze(signTxData: type.FreezeData): Promise<{ r: string; s: string; } | Buffer> {

		const script = scripts.FREEZE.script + scripts.FREEZE.signature;
		const argement = trxUtil.getFreezeArgement(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}

	async signUnfreeze(signTxData: type.UnfreezeData): Promise<{ r: string; s: string; } | Buffer> {

		const script = scripts.UNFREEZE.script + scripts.UNFREEZE.signature;
		const argement = trxUtil.getUnfreezeArgement(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}


	async signVoteWitness(signTxData: type.VoteWitnessData): Promise<{ r: string; s: string; } | Buffer> {

		const script = scripts.VOTE.script + scripts.VOTE.signature;
		const argement = trxUtil.getVoteWitnessArgement(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}

	async signWithdrawBalance(signTxData: type.WithdrawBalanceData): Promise<{ r: string; s: string; } | Buffer> {

		const script = scripts.VOTE.script + scripts.VOTE.signature;
		const argement = trxUtil.getWithdrawBalanceArgement(signTxData.transaction, signTxData.addressIndex)

		return trxSign.signTransaction(
			signTxData,
			script,
			argement
		);
	}
}
