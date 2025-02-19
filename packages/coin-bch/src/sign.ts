import { tx } from '@coolwallet/core';
import * as types from './config/types';
import * as txUtil from './utils/transactionUtil';
import * as scriptUtil from './utils/scriptUtil';
import { SignatureType } from '@coolwallet/core/lib/transaction';

export async function signTransaction(
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
	({ preActions, actions } = await scriptUtil.getScriptSigningActions(
		transport,
		scriptType,
		appId,
		appPrivateKey,
		inputs,
		preparedData,
		output,
		change,
	));
	const signatures = await tx.flow.getSignaturesFromCoolWalletV2(
		transport,
		preActions,
		actions,
		SignatureType.DER,
		signTxData.confirmCB,
		signTxData.authorizedCB,
	);
	const transaction = txUtil.composeFinalTransaction(scriptType, preparedData, signatures as Buffer[]);
	return transaction.toString('hex');
}

