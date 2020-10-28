import { tx, transport, util, error } from '@coolwallet/core';
import { ScriptType, OmniType, Input, Output, Change, PreparedData } from './utils/types'
import * as scripts from "./scripts";
import {
	createUnsignedTransactions,
	composeFinalTransaction,
} from './utils/transactionUtil';
import {
	getSigningActions,
	getScriptSigningActions,
	getScriptSigningPreActions,
	getBTCArgument,
	getUSDTArgument
} from './utils/scriptUtil';
import { signTxType, signUSDTTxType, Transport } from './utils/types';
import { Transaction } from 'bitcoinjs-lib';

export async function signBTCTransaction(
	signTxData: signTxType,
): Promise<string> {
	const { scriptType: redeemScriptType, transport, inputs, output, change, appId, appPrivateKey, confirmCB, authorizedCB } = signTxData

	// const useScript = await util.checkSupportScripts(transport);
	chsckRedeemScriptType(redeemScriptType)

	const { preparedData } = createUnsignedTransactions(
		redeemScriptType,
		inputs,
		output,
		change
	);

	const argument = getBTCArgument(redeemScriptType, inputs, output, change);

	const script = scripts.TRANSFER.script + scripts.TRANSFER.signature;

	const { preActions } = getScriptSigningPreActions(
		transport,
		appId,
		appPrivateKey,
		script,
		argument
	)

	return await signTransaction(
		transport,
		appId,
		appPrivateKey,
		preActions,
		redeemScriptType,
		preparedData,
		confirmCB,
		authorizedCB)
}

export async function signUSDTransaction(
	signUSDTTxData: signUSDTTxType
): Promise<string> {
	const { scriptType: redeemScriptType, transport, inputs, output, change, appId, appPrivateKey, confirmCB, authorizedCB, value } = signUSDTTxData

	chsckRedeemScriptType(redeemScriptType)

	const omniType = OmniType.USDT

	const { preparedData } = createUnsignedTransactions(
		redeemScriptType,
		inputs,
		output,
		change,
		value,
		omniType
	);

	const script = scripts.USDT.script + scripts.USDT.signature;
	const argument = await getUSDTArgument(redeemScriptType, inputs, output, value, change );

	const { preActions } = getScriptSigningPreActions(
		transport,
		appId,
		appPrivateKey,
		script,
		argument
	)

	return await signTransaction(
		transport,
		appId,
		appPrivateKey,
		preActions,
		redeemScriptType,
		preparedData,
		confirmCB,
		authorizedCB)

	// return signTransaction100(
	// 	transport,
	// 	appId,
	// 	appPrivateKey,
	// 	redeemScriptType,
	// 	inputs,
	// 	output,
	// 	change,
	// 	confirmCB,
	// 	authorizedCB,
	// 	value,
	// 	omniType
	// )
}


async function signTransaction(
	transport: Transport,
	appId: string,
	appPrivateKey: string,
	preActions: Array<Function>,
	redeemScriptType: ScriptType,
	preparedData: PreparedData,
	confirmCB?: Function,
	authorizedCB?: Function
): Promise<string> {

	const { actions } = getScriptSigningActions(
		transport,
		redeemScriptType,
		appId,
		appPrivateKey,
		preparedData
	);

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

async function chsckRedeemScriptType(redeemScriptType: ScriptType) {
	if (redeemScriptType !== ScriptType.P2PKH
		&& redeemScriptType !== ScriptType.P2WPKH
		&& redeemScriptType !== ScriptType.P2SH_P2WPKH) {
		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
	}
}


// async function signTransaction100(
// 	transport: Transport,
// 	appId: string,
// 	appPrivateKey: string,
// 	redeemScriptType: ScriptType,
// 	inputs: [Input],
// 	output: Output,
// 	change?: Change,
// 	confirmCB?: Function,
// 	authorizedCB?: Function,
// 	value?: string,
// 	omniType?: OmniType
// ): Promise<string> {


// 	if (redeemScriptType !== ScriptType.P2PKH
// 		&& redeemScriptType !== ScriptType.P2WPKH
// 		&& redeemScriptType !== ScriptType.P2SH_P2WPKH) {
// 		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
// 	}
// 	const useScript = await util.checkSupportScripts(transport);
// 	const { preparedData, unsignedTransactions } = createUnsignedTransactions(
// 		redeemScriptType,
// 		inputs,
// 		output,
// 		change,
// 		value,
// 		omniType
// 	);
// 	let preActions, actions;
// 	({ preActions, actions } = getSigningActions(
// 		transport,
// 		redeemScriptType,
// 		appId,
// 		appPrivateKey,
// 		change,
// 		preparedData,
// 		unsignedTransactions,
// 		omniType
// 	));
// 	const signatures = await tx.flow.getSignaturesFromCoolWallet(
// 		transport,
// 		preActions,
// 		actions,
// 		false,
// 		confirmCB,
// 		authorizedCB,
// 		false
// 	);
// 	const transaction = composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
// 	return transaction.toString('hex');
// }

// async function signTransaction(
// 	transport: Transport,
// 	appId: string,
// 	appPrivateKey: string,
// 	redeemScriptType: ScriptType,
// 	inputs: [Input],
// 	output: Output,
// 	change?: Change,
// 	confirmCB?: Function,
// 	authorizedCB?: Function,
// 	value?: string,
// 	omniType?: OmniType
// ): Promise<string> {


// 	if (redeemScriptType !== ScriptType.P2PKH
// 		&& redeemScriptType !== ScriptType.P2WPKH
// 		&& redeemScriptType !== ScriptType.P2SH_P2WPKH) {
// 		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${redeemScriptType}'`);
// 	}
// 	const useScript = await util.checkSupportScripts(transport);
// 	const { preparedData, unsignedTransactions } = createUnsignedTransactions(
// 		redeemScriptType,
// 		inputs,
// 		output,
// 		change,
// 		value,
// 		omniType
// 	);
// 	let preActions, actions;
// 	if (useScript) {
// 		({ preActions, actions } = getScriptSigningActions(
// 			transport,
// 			redeemScriptType,
// 			appId,
// 			appPrivateKey,
// 			inputs,
// 			preparedData,
// 			output,
// 			change,
// 		));
// 	} else {
// 		({ preActions, actions } = getSigningActions(
// 			transport,
// 			redeemScriptType,
// 			appId,
// 			appPrivateKey,
// 			change,
// 			preparedData,
// 			unsignedTransactions,
// 			omniType
// 		));
// 	}
// 	const signatures = await tx.flow.getSignaturesFromCoolWallet(
// 		transport,
// 		preActions,
// 		actions,
// 		false,
// 		confirmCB,
// 		authorizedCB,
// 		false
// 	);
// 	const transaction = composeFinalTransaction(redeemScriptType, preparedData, signatures as Buffer[]);
// 	return transaction.toString('hex');
// }

