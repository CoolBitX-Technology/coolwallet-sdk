import { tx, transport, error, util } from '@coolwallet/core';
import { ScriptType } from './config/types'
import {
	Input,
	Output,
	Change,
	createUnsignedTransactions,
	composeFinalTransaction,
} from './utils/transactionUtil';
import { getScriptSigningActions } from './utils/actionUtil'

import { Transport, signTxType } from "./config/types";

export {
	signTransaction
};

async function signTransaction(
	signTxData: signTxType
): Promise<string> {

	const { scriptType, transport, inputs, output, change, appPrivateKey, appId } = signTxData

	if (scriptType !== ScriptType.P2PKH
		&& scriptType !== ScriptType.P2SH) {
		throw new error.SDKError(signTransaction.name, `Unsupport ScriptType '${scriptType}'`);
	}
	
	const { preparedData } = createUnsignedTransactions(
		scriptType,
		inputs,
		output,
		change
	);
	let preActions, actions;
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

