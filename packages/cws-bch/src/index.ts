import { coin as COIN, transport } from '@coolwallet/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	addressToOutScript,
	pubkeyToAddressAndOutScript
} from './util';

import { signTransaction } from './sign';
import { signTxType } from './types';

type Transport = transport.default;

export const coinType = '91'

export default class BCH extends COIN.ECDSACoin implements COIN.Coin {

	public ScriptType: any;
	public addressToOutScript: Function;

	constructor() {
		super(coinType);
		this.ScriptType = ScriptType;
		this.addressToOutScript = addressToOutScript;
	}

	async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<string> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		const { address } = pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
		return address;
	}

	async getAddressAndOutScript(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
	}

	async signTransaction(
		signTxData: signTxType
	): Promise<string> {
		console.log(signTxData)
		const inputs = signTxData.inputs;
		console.log(inputs)
		for (const input of inputs) {
			console.log("input: " + input.preValue)
			// eslint-disable-next-line no-await-in-loop
			const pubkey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, input.addressIndex);
			input.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		if (signTxData.change) {
			console.log("change: " + signTxData.change.value)
			const pubkey = await this.getPublicKey(signTxData.transport, signTxData.appPrivateKey, signTxData.appId, signTxData.change.addressIndex);
			// eslint-disable-next-line no-param-reassign
			signTxData.change.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		return signTransaction(
			signTxData
		);
	}
}
