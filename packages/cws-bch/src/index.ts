import { coin as COIN } from '@coolwallet/core'; 
import { signTransaction } from './sign';
import * as types from './config/types';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtil';

export default class BCH extends COIN.ECDSACoin implements COIN.Coin {

	public ScriptType: any;
	public addressToOutScript: Function;

	constructor() {
		super(params.COIN_TYPE);
		this.ScriptType = types.ScriptType;
		this.addressToOutScript = txUtil.addressToOutScript;
	}

	async getAddress(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<string> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		const { address } = txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
		return address;
	}

	async getAddressAndOutScript(transport: types.Transport, appPrivateKey: string, appId: string, addressIndex: number)
		: Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getPublicKey(transport, appPrivateKey, appId, addressIndex);
		return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
	}

	async getAddressAndOutScriptByAccountKey(accPublicKey: string, accChainCode: string, addressIndex: number): Promise<{ address: string, outScript: Buffer }> {
		const publicKey = await this.getAddressPublicKey(accPublicKey, accChainCode, addressIndex);
		return txUtil.pubkeyToAddressAndOutScript(Buffer.from(publicKey, 'hex'));
	}


	async signTransaction(
		signTxData: types.signTxType
	): Promise<string> {
		
		const inputs = signTxData.inputs;
		
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
