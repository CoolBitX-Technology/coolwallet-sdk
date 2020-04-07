import { core } from '@coolwallets/core';
import { ECDSACoin } from '@coolwallets/coin';
import {
	ScriptType,
	Input,
	Output,
	Change,
	pubkeyToAddress,
} from './utils';

import { createUnsignedTransactions, composeFinalTransaction } from './btc_sign';

type Transport = import('@coolwallets/transport').default;

export default class BTC extends ECDSACoin {
	public network: any;

	constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
		super(transport, appPrivateKey, appId, '00');
		this.network = network;
	}

	async getAddress(scriptType: ScriptType, addressIndex: number): Promise<string> {
		const publicKey = await this.getPublicKey(addressIndex);
		return pubkeyToAddress(Buffer.from(publicKey, 'hex'), scriptType);
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

		const {
			preparedData,
			unsignedTransactions
		} = createUnsignedTransactions(scriptType, inputs, output, change);

		const actions = getSigningActions(
			this.transport,
			scriptType,
			this.appPrivateKey,
			unsignedTransactions,
		);
		const signatures = core.flow.sendBatchDataToCoolWallet(
			this.transport,
			this.appId,
			this.appPrivateKey,
			actions,
			false,
			confirmCB,
			authorizedCB,
			false
		);

		const transaction = composeFinalTransaction(scriptType, preparedData, signatures);
		return transaction.toString('hex');
	}
}

function getSigningActions(
	transport: Transport,
	scriptType: ScriptType,
	appPrivateKey: string,
	unsignedTransactions: Array<Buffer>,

): Array<Function> {
	if (scriptType === ScriptType.P2PKH) {
	}
	const p2pkhReadtype = '00';
	const outputsLen = change ? '02' : '01';
	const outputsHex = outputsLen + genUnsignedOutputsHex(output, change);

	return inputs.map((input) => {
		const keyId = core.util.addressIndexToKeyId('00', input.addressIndex);
		const payload = composeUnsignedTxOfP2PKH(input, outputsHex);
		const txDataHex = core.flow.prepareSEData(keyId, payload, p2pkhReadtype);
		const txDataType = '00';
		return core.util.createPrepareTxAction(transport, txDataHex, txDataType, appPrivateKey);
	});
}

