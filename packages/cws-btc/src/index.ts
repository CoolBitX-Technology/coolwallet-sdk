import { coin as COIN, transport } from '@coolwallet/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	addressToOutScript,
	pubkeyToAddressAndOutScript
} from './utils';

import { signTransaction } from './btcSign';
import { signTxType } from './utils/types';

type Transport = transport.default;

export const coinType = '00'

export default class BTC extends COIN.ECDSACoin implements COIN.Coin {

	public ScriptType: any;
	public addressToOutScript: Function; 

	constructor() {
		super(coinType);
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
		return signTransaction(
			signTxData
		);
	}
}

