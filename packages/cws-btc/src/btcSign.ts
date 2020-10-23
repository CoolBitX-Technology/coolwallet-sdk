import { tx, transport, util, error } from '@coolwallet/core';
import { ScriptType, OmniType, Input, Output, Change } from './utils/types'
import {
	createUnsignedTransactions,
	composeFinalTransaction,
} from './utils/transactionUtil';
import {
	getSigningActions,
	getScriptSigningActions
} from './utils/scriptUtil';
import { signTxType, signUSDTTxType, Transport } from './utils/types';

export async function signBTCTransaction(
	signTxData: signTxType,
): Promise<string> {
	const { redeemScriptType, transport, inputs, output, change, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData
	return await signTransaction(
		transport,
		appId,
		appPrivateKey,
		redeemScriptType,
		inputs,
		output,
		change,
		confirmCB,
		authorizedCB)
}

export async function signUSDTransaction(
	signUSDTTxData: signUSDTTxType
): Promise<string> {
	const { redeemScriptType, transport, inputs, output, change, appId, appPrivateKey, confirmCB, authorizedCB, value } = signUSDTTxData
	return await signTransaction(
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
		OmniType.USDT)
}

async function signTransaction(
	transport: Transport,
	appId: string,
	appPrivateKey: string,
	redeemScriptType: ScriptType,
	inputs: [Input],
	output: Output,
	change?: Change,
	confirmCB?: Function,
	authorizedCB?: Function,
	value?: string,
	omniType?: OmniType
): Promise<string> {

	// const { redeemScriptType, transport, inputs, output, change, appId, appPrivateKey } = signTxData

	if (redeemScriptType !== ScriptType.P2PKH
		&& redeemScriptType !== ScriptType.P2WPKH
		&& redeemScriptType !== ScriptType.P2SH_P2WPKH) {
		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
	}
	const useScript = await util.checkSupportScripts(transport);
	const { preparedData, unsignedTransactions } = createUnsignedTransactions(
		redeemScriptType,
		inputs,
		output,
		change,
		value,
		omniType
	);
	let preActions, actions;
	if (useScript) {
		({ preActions, actions } = getScriptSigningActions(
			transport,
			redeemScriptType,
			appId,
			appPrivateKey,
			inputs,
			preparedData,
			output,
			change,
		));
	} else {
		({ preActions, actions } = getSigningActions(
			transport,
			redeemScriptType,
			appId,
			appPrivateKey,
			change,
			preparedData,
			unsignedTransactions,
			omniType
		));
	}
	const signatures = await tx.flow.getSignaturesFromCoolWallet(
		transport,
		preActions,
		actions,
		false,
		confirmCB,
		authorizedCB,
		false
	);
	const transaction = composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
	return transaction.toString('hex');
}

