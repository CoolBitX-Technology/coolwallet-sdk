import { core } from '@coolwallets/core';
import { ECDSACoin } from '@coolwallets/coin';
import {
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	pubkeyToAddressAndOutScript,
} from './utils';

import { createUnsignedTransactions, composeFinalTransaction } from './btc_sign';

type Transport = import('@coolwallets/transport').default;

export default class BTC extends ECDSACoin {
	public network: any;

	public ScriptType: any;

	constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
		super(transport, appPrivateKey, appId, '00');
		this.network = network;
		this.ScriptType = ScriptType;
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

		const {
			preparedData,
			unsignedTransactions
		} = createUnsignedTransactions(scriptType, inputs, output, change);

		const { preActions, actions } = getSigningActions(
			this.transport,
			scriptType,
			this.appPrivateKey,
			preparedData,
			unsignedTransactions,
		);
		const signatures = await core.flow.sendBatchDataToCoolWallet(
			this.transport,
			this.appId,
			this.appPrivateKey,
			preActions,
			actions,
			false,
			confirmCB,
			authorizedCB,
			false
		);

		const transaction = composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
		return transaction.toString('hex');
	}
}

function getSigningActions(
	transport: Transport,
	scriptType: ScriptType,
	appPrivateKey: string,
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>,

): ({preActions: Array<Function>, actions: Array<Function>}) {
	const preAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		const txDataType = (preparedData.outputType === ScriptType.P2SH_P2WPKH) ? '0C' : '01';
		return core.util.prepareOutputData(transport, txDataHex, txDataType);
	};
	const preActions = [preAction];

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = core.util.addressIndexToKeyId('00', preparedData.preparedInputs[i].addressIndex);
		const readType = '01';
		const txDataHex = core.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return core.util.prepareTx(transport, txDataHex, txDataType, appPrivateKey);
	}));

	return { preActions, actions };
}
