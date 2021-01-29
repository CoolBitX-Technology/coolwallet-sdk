import { coin as COIN } from '@coolwallet/core';
import { addressToOutScript, pubkeyToAddressAndOutScript } from './utils/transactionUtil';
import { signBTCTransaction, signUSDTransaction } from './sign';
import { ScriptType, signTxType, signUSDTTxType, Transport } from './config/types';
import { COIN_TYPE } from './config/param'
export default class BTC extends COIN.ECDSACoin implements COIN.Coin {

	public ScriptType: any;
	public addressToOutScript: Function;

	constructor() {
		super(COIN_TYPE);
		this.ScriptType = ScriptType;
		this.addressToOutScript = addressToOutScript;
	}

	async getAddress(transport: Transport, appPrivateKey: string, appId: string, scriptType: ScriptType, addressIndex: number)
		: Promise<string> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		const { address } = pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
		return address;
	}

	async getAddressAndOutScript(transport: Transport, appPrivateKey: string, appId: string, scriptType: ScriptType, addressIndex: number)
		: Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
	}

	async signTransaction(
		signTxData: signTxType

	): Promise<string> {
		for (const input of signTxData.inputs) {
			// eslint-disable-next-line no-await-in-loop
			const pubkey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, input.addressIndex);
			input.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		if (signTxData.change) {
			const pubkey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.change.addressIndex);
			// eslint-disable-next-line no-param-reassign
			signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		return signBTCTransaction(
			signTxData
		);
	}

	async signUSDTTransaction(
		signUSDTTxData: signUSDTTxType
	): Promise<string> {
		const { transport, appId, appPrivateKey } = signUSDTTxData

		for (const input of signUSDTTxData.inputs) {
			// eslint-disable-next-line no-await-in-loop
			const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, input.addressIndex);
			input.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}

		if (signUSDTTxData.change) {
			const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, signUSDTTxData.change.addressIndex);
			signUSDTTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		return signUSDTransaction(
			signUSDTTxData
		);
	}
}

