import { tx, transport, error, util } from '@coolwallet/core';
import {
	ScriptType,
	Input,
	Output,
	Change,
	createUnsignedTransactions,
	getSigningActions,
	composeFinalTransaction,
	getScriptAndArgument
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
	const useScript = await util.checkSupportScripts(transport);
	let signatures
	if (useScript) {
		const { preparedData } = createUnsignedTransactions(
			scriptType,
			inputs,
			output,
			change
		);
		const { preActions, actions } = getScriptAndArgument(
			transport,
			appId,
			appPrivateKey,
			inputs,
			preparedData,
			output,
			change,
		);
		signatures = await tx.flow.getSignaturesFromCoolWallet(
			transport,
			preActions,
			actions,
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
		signatures = await tx.flow.getSignaturesFromCoolWallet(
			transport,
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

