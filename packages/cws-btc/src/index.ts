import { coin as COIN, transport, error } from '@coolwallet/core';
import { ScriptType, OmniType, Input, Output, Change } from './utils/types'
import {
	addressToOutScript,
	pubkeyToAddressAndOutScript
} from './utils/transactionUtil';
import { signTransaction } from './btcSign';

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
		transport: Transport,
		appPrivateKey: string,
		appId: string,
		redeemScriptType: ScriptType,
		inputs: [Input],
		output: Output,
		change?: Change,
		confirmCB?: Function,
		authorizedCB?: Function,
	): Promise<string> {
		if (redeemScriptType !== ScriptType.P2PKH
			&& redeemScriptType !== ScriptType.P2WPKH
			&& redeemScriptType !== ScriptType.P2SH_P2WPKH) {
			throw new error.SDKError(this.signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
		}
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
			redeemScriptType,
			inputs,
			output,
			change,
			confirmCB,
			authorizedCB
		);
	}

	async signUSDTTransaction(
		transport: Transport,
		appPrivateKey: string,
		appId: string,
		redeemScriptType: ScriptType,
		inputs: [Input],
		value: string,
		output: Output,
		change?: Change,
		confirmCB?: Function,
		authorizedCB?: Function,
	): Promise<string> {
		/*if (redeemScriptType !== ScriptType.P2PKH
			&& redeemScriptType !== ScriptType.P2WPKH) {
			throw new error.SDKError(this.signUSDTTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
		}*/
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
			redeemScriptType,
			inputs,
			output,
			change,
			confirmCB,
			authorizedCB,
			value,
			OmniType.USDT
		);
	}
}
