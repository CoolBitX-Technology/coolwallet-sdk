import { tx, transport, error, util } from '@coolwallet/core';
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

import { Transport, signTxType } from './types';

export {
	signTransaction
};

async function signTransaction(
	signTxData: signTxType,
	coinType: string,
): Promise<string> {

	const { scriptType, transport, inputs, output, change, appId, appPrivateKey } = signTxData

	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2WPKH
		&& scriptType !== ScriptType.P2SH_P2WPKH) {
		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
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
			coinType
		));
	} else {
		({ preActions, actions } = getSigningActions(
			transport,
			scriptType,
			appId,
			appPrivateKey,
			change,
			coinType,
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

