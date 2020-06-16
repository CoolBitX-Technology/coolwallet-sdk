import { core, apdu, coin as COIN, Transport } from '@coolwallets/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	addressToOutScript,
	pubkeyToAddressAndOutScript,
} from './utils';

import { createUnsignedTransactions, composeFinalTransaction } from './btc_sign';

// import { Input, Output, Param } from './types';
// import * as common from './common';
// import { BTC as BTCONFIG } from './constants';

// type Transport = import('@coolwallets/transport').default;

export default class BTC extends COIN.ECDSACoin {
	public network: any;

	public ScriptType: any;

	public addressToOutScript: Function;

	constructor(transport: Transport, appPrivateKey: string, appId: string, network: any) {
		super(transport, appPrivateKey, appId, '00');
		this.network = network;
		this.ScriptType = ScriptType;
		this.addressToOutScript = addressToOutScript;
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
			this.appId,
			this.appPrivateKey,
			change,
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
	appId: string,
	appPrivateKey: string,
	change: Change | undefined,
	preparedData: PreparedData,
	unsignedTransactions: Array<Buffer>,

): ({ preActions: Array<Function>, actions: Array<Function> }) {
	const preActions = [];

	if (change) {
		const changeAction = async () => {
			const cmd = 'SET_CHANGE_KEYID';
			if (scriptType === ScriptType.P2WPKH) throw new Error('not support P2WPKH change');
			const redeemType = (scriptType === ScriptType.P2PKH) ? '00' : '01';
			const keyId = change.addressIndex.toString(16).padStart(10, '0');
			const sig = await core.auth.getCommandSignature(
				transport, appId, appPrivateKey, cmd, keyId, redeemType
			);
			const pathWithSig = keyId + sig.signature;
			await apdu.tx.setChangeKeyId(transport, pathWithSig, redeemType);
		};
		preActions.push(changeAction);
	}

	const parsingOutputAction = async () => {
		const txDataHex = preparedData.outputsBuf.toString('hex');
		const txDataType = (preparedData.outputType === ScriptType.P2WPKH) ? '0C' : '01';
		return core.util.prepareOutputData(transport, txDataHex, txDataType);
	};
	preActions.push(parsingOutputAction);

	const actions = unsignedTransactions.map((unsignedTx, i) => (async () => {
		const keyId = core.util.addressIndexToKeyId('00', preparedData.preparedInputs[i].addressIndex);
		const readType = '01';
		const txDataHex = core.flow.prepareSEData(keyId, unsignedTx, readType);
		const txDataType = '00';
		return core.util.prepareTx(transport, txDataHex, txDataType, appPrivateKey);
	}));

	return { preActions, actions };
}
