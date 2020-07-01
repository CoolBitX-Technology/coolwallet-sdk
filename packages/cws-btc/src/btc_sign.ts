import { core, transport, error } from '@coolwallet/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	createUnsignedTransactions,
	getSigningActions,
	composeFinalTransaction,
	getScriptAndArgument,
	getUtxoArguments
} from './utils';
type Transport = transport.default;

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
	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2WPKH
		&& scriptType !== ScriptType.P2SH_P2WPKH) {
		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
	}
	const useScript = await core.controller.checkSupportScripts(transport);
	let signatures;
	if (useScript) {
		const { preparedData, unsignedTransactions } = createUnsignedTransactions(
			scriptType,
			inputs,
			output,
			change
		);
		const { script, argument } = getScriptAndArgument(
			inputs,
			output,
			change,
		);
		const utxoArguments = getUtxoArguments(inputs, preparedData);
		signatures = await core.flow.sendBatchScriptAndDataToCard(
			transport,
			appId,
			appPrivateKey,
			script,
			argument,
			utxoArguments,
			false,
			confirmCB,
			authorizedCB,
			false
		);
		const transaction = composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
		return transaction.toString('hex');
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
		signatures = await core.flow.sendBatchDataToCoolWallet(
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

