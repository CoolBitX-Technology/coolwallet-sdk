import BN from 'bn.js';
import * as bitcoin from 'bitcoinjs-lib';
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

	async getP2PKHAddress(addressIndex: number): Promise<string> {
		const publicKey = await this.getPublicKey(addressIndex);
		return pubkeyToAddress(Buffer.from(publicKey, 'hex'), ScriptType.P2PKH);
	}

	async getP2SHAddress(addressIndex: number): Promise<string> {
		const publicKey = await this.getPublicKey(addressIndex);
		return pubkeyToAddress(Buffer.from(publicKey, 'hex'), ScriptType.P2SH_P2WPKH);
	}

	async signP2PKHTransaction(
		inputs: [Input],
		output: Output,
		change?: Change,
		confirmCB?: Function,
		authorizedCB?: Function,
	): Promise<Array<string>> {
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

		const { preparedData, unsignedTransactions } = createUnsignedTransactions(
			inputs, output, change, ScriptType.P2PKH
		);

		const actions = getSigningActionsOfP2PKH(
			this.transport,
			this.appPrivateKey,
			inputs,
			output,
			change
		);
		return core.flow.sendBatchDataToCoolWallet(
			this.transport,
			this.appId,
			this.appPrivateKey,
			actions,
			false,
			confirmCB,
			authorizedCB,
			false
		);
	}

	async signP2SHTransaction(
		inputs: [Input],
		output: Output,
		change?: Change,
		confirmCB = null,
		authorizedCB = null,
	): Promise<string> {
		for (const input of inputs) {
			// eslint-disable-next-line no-await-in-loop
			input.address = await this.getP2SHAddress(input.addressIndex);
		}
		// eslint-disable-next-line no-param-reassign
		if (change) change.address = await this.getP2SHAddress(change.addressIndex);

		const actions = getSigningActionsOfP2SH(
			this.transport,
			this.appPrivateKey,
			inputs,
			output,
			change
		);
		return core.flow.sendBatchDataToCoolWallet(
			this.transport,
			this.appId,
			this.appPrivateKey,
			actions,
			false,
			confirmCB,
			authorizedCB,
			false
		);
	}
}

function genUnsignedOutputsHex(output: Output, change?: Change): string {
	let outputsHex = '';
	outputsHex += satoshiStringToHex(output.value);
	outputsHex += getOutScriptFromAddress(output.address);
	if (change && change.address) {
		outputsHex += satoshiStringToHex(change.value);
		outputsHex += getOutScriptFromAddress(change.address);
	}
	return outputsHex;
}

function satoshiStringToHex(satoshi: string): string {
	const bn = new BN(satoshi);
	const buf = Buffer.from(bn.toString(16), 'hex').reverse();
	return Buffer.alloc(8).fill(buf, 0, buf.length).toString('hex');
}

function outputIndexNumberToHex(index: number): string {
	const buf = Buffer.from(index.toString(16), 'hex').reverse();
	return Buffer.alloc(4).fill(buf, 0, buf.length).toString('hex');
}

function getOutScriptFromAddress(address: string): string {
	let payment;
	if (address.startsWith('1')) {
		payment = bitcoin.payments.p2pkh({ address });
	} else if (address.startsWith('3')) {
		payment = bitcoin.payments.p2sh({ address });
	} else if (address.startsWith('bc1')) {
		payment = bitcoin.payments.p2wpkh({ address });
	}
	if (!payment || !payment.output) throw new Error(`Unsupport Address : ${address}`);
	const buf = payment.output;
	return `${buf.length.toString(16)}${buf.toString('hex')}`;
}

function getSigningActionsOfP2PKH(
	transport: Transport,
	appPrivateKey: string,
	inputs: [Input],
	output: Output,
	change?: Change
) {
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

function getSigningActionsOfP2SH(
	transport: Transport,
	appPrivateKey: string,
	inputs: [Input],
	output: Output,
	change?: Change
) {
	const p2pkhReadtype = '00';
	const outputsLen = change ? '02' : '01';
	const outputsHex = outputsLen + genUnsignedOutputsHex(output, change);

	return inputs.map((input) => {
		const keyId = core.util.addressIndexToKeyId('00', input.addressIndex);
		const payload = composeUnsignedTxOfP2SH(input, outputsHex);
		const txDataHex = core.flow.prepareSEData(keyId, payload, p2pkhReadtype);
		const txDataType = '00';
		return core.util.createPrepareTxAction(transport, txDataHex, txDataType, appPrivateKey);
	});
}

