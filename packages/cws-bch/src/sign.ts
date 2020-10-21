import { tx, transport, util } from '@coolwallet/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	createUnsignedTransactions,
	getSigningActions,
	composeFinalTransaction,
	getScriptSigningActions
} from './util';
import { signTxType } from './types';
type Transport = transport.default;


export {
	signTransaction
};

async function signTransaction(
	signTxData: signTxType
): Promise<string> {

	const scriptType = signTxData.scriptType;
	const transport = signTxData.transport;
	const appId = signTxData.appId;
	const appPrivateKey = signTxData.appPrivateKey;
	const inputs = signTxData.inputs;
	const output = signTxData.output;
	const change = signTxData.change;

	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2SH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	const useScript = await util.checkSupportScripts(transport);
	const { preparedData, unsignedTransactions } = createUnsignedTransactions(
		scriptType,
		inputs,
		output,
		change
	);
	let preActions, actions;
	if (useScript) {
		({ preActions, actions } = getScriptSigningActions(
			transport,
			scriptType,
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
			scriptType,
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
		signTxData.confirmCB,
		signTxData.authorizedCB,
		false
	);
	const transaction = composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
	return transaction.toString('hex');
}

