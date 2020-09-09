import BN from 'bn.js';
import { transport, error, tx, apdu } from '@coolwallet/core';
import * as varuint from './varuint';
import * as scripts from "../scripts";
import { coinType } from '../index'
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
type Transport = transport.default;
const litecore = require("litecore-lib");

export {
	ScriptType,
	Input,
	Output,
	Change,
	PreparedData,
	pubkeyToAddressAndOutScript,
	addressToOutScript,
	// createUnsignedTransactions,
	// getSigningActions,
	// composeFinalTransaction,
	// getScriptSigningActions
};


function addressToOutScript(address: string): ({ scriptType: ScriptType, outScript: Buffer, outHash?: Buffer }) {
	let scriptType;
	let payment;
	if (address.startsWith('1')) {
		scriptType = ScriptType.P2PKH;
		payment = litecore.payments.p2pkh({ address });
	} else if (address.startsWith('3')) {
		scriptType = ScriptType.P2SH_P2WPKH;
		payment = litecore.payments.p2sh({ address });
	} else if (address.startsWith('bc1')) {
		scriptType = ScriptType.P2WPKH;
		payment = litecore.payments.p2wpkh({ address });
	} else {
		throw new error.SDKError(addressToOutScript.name, `Unsupport Address '${address}'`);
	}
	if (!payment.output) throw new error.SDKError(addressToOutScript.name, `No OutScript for Address '${address}'`);
	const outScript = payment.output;
	const outHash = payment.hash;
	return { scriptType, outScript, outHash };
}

function pubkeyToAddressAndOutScript(pubkey: Buffer, scriptType: ScriptType)
	: { address: string } {
		
	// alternative interface

	const Address = litecore.Address;
	const PublicKey = litecore.PublicKey
	const pubkeyObj = new PublicKey(pubkey);
	const addressObj = Address.fromPublicKey(pubkeyObj)

	console.log(pubkeyObj)

	console.log(addressObj)
	console.log(Buffer.from(addressObj.hashBuffer))
	console.log(Buffer.from(addressObj.hashBuffer).toString('hex'))

	return { address: addressObj };
}
