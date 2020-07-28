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

type Transport = transport.default;

export default class BCH extends COIN.ECDSACoin implements COIN.Coin {
	public network: any;

	public ScriptType: any;

	public addressToOutScript: Function;

	constructor(network: any) {
		super('91');
		this.network = network;
		this.ScriptType = ScriptType;
		this.addressToOutScript = addressToOutScript;
	}

	async getAddress(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<string> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		const { address } = pubkeyToAddressAndOutScript(publicKey);
		return address;
	}

	async getAddressAndOutScript(transport: Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
	}

	async signTransaction(
		transport: Transport,
		appPrivateKey: string,
		appId: string,
		scriptType: ScriptType,
		inputs: [Input],
		output: Output,
		change?: Change,
		confirmCB?: Function,
		authorizedCB?: Function,

	): Promise<string> {
		for (const input of inputs) {
			// eslint-disable-next-line no-await-in-loop
			const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, input.addressIndex);
			input.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		if (change) {
			const pubkey = await this.getPublicKey(transport, appPrivateKey, appId, change.addressIndex);
			// eslint-disable-next-line no-param-reassign
			change.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		return signTransaction(
			transport,
			appId,
			appPrivateKey,
			scriptType,
			inputs,
			output,
			change,
			confirmCB,
			authorizedCB
		);
	}
}