import { tx, transport, error, util } from '@coolwallet/core';
import { ScriptType, Input, Output, Change } from './utils/types'
import {
	createUnsignedTransactions,
	composeFinalTransaction,
} from './utils/transactionUtil';
import {
	getSigningActions,
	getScriptSigningActions
} from './utils/scriptUtil';
type Transport = transport.default;

export {
	signTransaction
};

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
): Promise<string> {
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
		change
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

