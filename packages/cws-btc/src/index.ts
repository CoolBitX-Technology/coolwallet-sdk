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

type Transport = transport.default;

export default class BTC extends COIN.ECDSACoin implements COIN.Coin {
	public network: any;

	public ScriptType: any;

	public addressToOutScript: Function;

	constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
		super(transport, appPrivateKey, appId, '00');
		this.network = network;
		this.ScriptType = ScriptType;
		this.addressToOutScript = addressToOutScript;
	}

	async getAddress(scriptType: ScriptType, addressIndex: number)
		: Promise<string> {
		const publicKey = await this.getPublicKey(addressIndex);
		const { address } = pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
		return address;
	}

	async getAddressAndOutScript(scriptType: ScriptType, addressIndex: number)
		: Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getPublicKey(addressIndex);
		return pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'), scriptType);
	}

	async signTransaction(
		scriptType: ScriptType,
		inputs: [Input],
		output: Output,
		change?: Change,
		confirmCB?: Function,
		authorizedCB?: Function,

	): Promise<string> {
		for (const input of inputs) {
			// eslint-disable-next-line no-await-in-loop
			const pubkey = await this.getPublicKey(input.addressIndex);
			input.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		if (change) {
			const pubkey = await this.getPublicKey(change.addressIndex);
			// eslint-disable-next-line no-param-reassign
			change.pubkeyBuf = Buffer.from(pubkey, 'hex');
		}
		return signTransaction(
			this.transport,
			this.appId,
			this.appPrivateKey,
			scriptType,
			inputs,
			output,
			change,
			confirmCB,
			authorizedCB
		);
	}
}
