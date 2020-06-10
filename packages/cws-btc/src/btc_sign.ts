import { core } from '@coolwallets/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	createUnsignedTransactions,
	getSigningActions,
	composeFinalTransaction,
	getScriptAndArguments
} from './utils';
type Transport = import("@coolwallets/transport").default;

export {
	signTransaction
};

async function signTransaction(
	transport: Transport,
	appId: string,
	appPrivateKey: string,
	scriptType: ScriptType,
	inputs: [Input],
	output: Output,
	change?: Change,
	confirmCB?: Function,
	authorizedCB?: Function,

): Promise<string> {
	const useScript = await core.controller.checkSupportScripts(transport);
	if (useScript) {
		const { script, argument } = getScriptAndArguments(
			scriptType,
			inputs,
			output,
			change
		);
		return "";
	} else {
		const { preparedData, unsignedTransactions } = createUnsignedTransactions(
			scriptType,
			inputs,
			output,
			change
		);

		const { preActions, actions } = getSigningActions(
			transport,
			scriptType,
			appId,
			appPrivateKey,
			change,
			preparedData,
			unsignedTransactions,
		);
		const signatures = await core.flow.sendBatchDataToCoolWallet(
			transport,
			appId,
			appPrivateKey,
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

