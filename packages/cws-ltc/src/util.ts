import BN from 'bn.js';
import { transport, error, tx, apdu } from '@coolwallet/core';
import * as varuint from './varuint';
import * as scripts from "./scripts";
import { coinType } from './index'
import * as bitcoin from 'bitcoinjs-lib';
import {
	ScriptType, Input, Output, Change, PreparedData
} from './types';
type Transport = transport.default;
const litecore = require("litecore-lib");
const base58 = require("bs58");

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

function pubkeyToAddressAndOutScript(pubkey: string, scriptType: ScriptType)
	: { address: string, outScript: Buffer, hash: Buffer } {

	const burPublicKey = Buffer.from(pubkey, 'hex');
	const activeNet = {
		"messagePrefix": "\x19Litecoin Signed Message:\n",
		"bech32": 'ltc',
		"bip32": {
			"public": 0x019da462,
			"private": 0x019d9cfe
		},
		"pubKeyHash": 0x30, // L
		"scriptHash": 0x32, // M
		"scripthash2": 0x05, // old '3' prefix. available for backward compatibility.
		"wif": 0xb0
	}

	const input = {
		pubkey: burPublicKey,
		network: activeNet,
	}

	let payment;
	if (scriptType === ScriptType.P2PKH) {
		payment = bitcoin.payments.p2pkh(input);
	} else if (scriptType === ScriptType.P2SH_P2WPKH) {
		payment = bitcoin.payments.p2sh({
			redeem: bitcoin.payments.p2wpkh(input),
		});
	} else if (scriptType === ScriptType.P2WPKH) {
		payment = bitcoin.payments.p2wpkh(input);
	} else {
		throw new error.SDKError(pubkeyToAddressAndOutScript.name, `Unsupport ScriptType '${scriptType}'`);
	}

	if (!payment.address) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No Address for ScriptType '${scriptType}'`);
	if (!payment.output) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
	if (!payment.hash) throw new error.SDKError(pubkeyToAddressAndOutScript.name, `No OutScript for ScriptType '${scriptType}'`);
	return { address: payment.address, outScript: payment.output, hash: payment.hash };
}
