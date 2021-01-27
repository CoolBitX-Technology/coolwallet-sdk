import { tx, transport, utils } from '@coolwallet/core';
import * as types from './config/types';
import * as params from './config/params';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
type Transport = transport.default;


export {
	signTransaction
};

async function signTransaction(
	signTxData: types.signTxType
): Promise<string> {

	const { scriptType, transport, appId, appPrivateKey, inputs, output, change } = signTxData;

	if (scriptType !== types.ScriptType.P2PKH
		&& scriptType !== types.ScriptType.P2SH) {
		throw new Error(`Unsupport ScriptType : ${scriptType}`);
	}
	const { preparedData } = txUtil.createUnsignedTransactions(
		scriptType,
		inputs,
		output,
		change
	);
	let preActions, actions;
	({ preActions, actions } = scriptUtil.getScriptSigningActions(
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
	const transaction = txUtil.composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
	return transaction.toString('hex');
}

