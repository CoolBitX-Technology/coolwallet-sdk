import { coin as COIN, } from '@coolwallet/core';
import * as trxSign from './sign';
import * as scriptUtil from './utils/scriptUtil';
import * as txUtil from './utils/transactionUtil';
import * as type from './config/types';
import { TX_TYPE } from './config/types';
import * as params from './config/params';

export { TX_TYPE };
export default class TRX extends COIN.ECDSACoin implements COIN.Coin {
	constructor() {
		super(params.COIN_TYPE);
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
		return txUtil.pubKeyToAddress(publicKey);
	}

	/**
	 * Sign Tron Transaction.
	 */
	async signTransaction(signTxData: type.NormalTradeData): Promise<string> {
		const {
		  transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const script = params.TRANSFER.script + params.TRANSFER.signature;
		const argement = await scriptUtil.getNormalTradeArgument(transaction, addressIndex);
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		return trxSign.signTransaction(
			signTxData,
			script,
			argement,
			publicKey
		);
	}

	async signFreeze(signTxData: type.FreezeData): Promise<string> {
		const {
		  transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const script = params.FREEZE.script + params.FREEZE.signature;
		const argement = await scriptUtil.getFreezeArgement(transaction, addressIndex)
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		return trxSign.signTransaction(
			signTxData,
			script,
			argement,
			publicKey
		);
	}

	async signUnfreeze(signTxData: type.UnfreezeData): Promise<string> {
		const {
		  transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const script = params.UNFREEZE.script + params.UNFREEZE.signature;
		const argement = await scriptUtil.getUnfreezeArgement(transaction, addressIndex)
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		return trxSign.signTransaction(
			signTxData,
			script,
			argement,
			publicKey
		);
	}

	async signVoteWitness(signTxData: type.VoteWitnessData): Promise<string>{
		const {
		  transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const script = params.VOTE.script + params.VOTE.signature;
		const argement = await scriptUtil.getVoteWitnessArgement(transaction, addressIndex)
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		return trxSign.signTransaction(
			signTxData,
			script,
			argement,
			publicKey
		);
	}

	async signWithdrawBalance(signTxData: type.WithdrawBalanceData): Promise<string> {
		const {
		  transport, transaction, appPrivateKey, appId, addressIndex, confirmCB, authorizedCB
		} = signTxData;

		const script = params.VOTE.script + params.VOTE.signature;
		const argement = await scriptUtil.getWithdrawBalanceArgement(transaction, addressIndex)
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);

		return trxSign.signTransaction(
			signTxData,
			script,
			argement,
			publicKey
		);
	}
}
