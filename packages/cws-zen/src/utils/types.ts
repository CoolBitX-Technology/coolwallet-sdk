import { transport } from '@coolwallet/core';
export type Transport = transport.default;

export type signTxType = {
	transport: Transport,
	appPrivateKey: string,
	appId: string,
	scriptType: ScriptType,
	inputs: [Input],
	output: Output,
	change?: Change,
	confirmCB?: Function,
	authorizedCB?: Function,
}


export enum ScriptType {
	P2PKH = 0,
	P2SH = 1,
}

export type Input = {
	preTxHash: string,
	preIndex: number,
	sequence?: number,
	scriptPubKey: string,
	addressIndex: number,
	pubkeyBuf?: Buffer,
};

export type Output = {
	value: string,
	address: string,
	blockHash: string,
	blockHeight: number,
};

export type Change = {
	value: string,
	addressIndex: number,
	pubkeyBuf?: Buffer,
	blockHash: string,
	blockHeight: number,
};

export type PreparedData = {
	versionBuf: Buffer,
	inputsCount: Buffer,
	preparedInputs: {
		addressIndex: number,
		pubkeyBuf: Buffer,
		preOutPointBuf: Buffer,
		sequenceBuf: Buffer,
		blockHashBuf: Buffer,
		blockHeightBuf: Buffer,
	}[],
	outputType: ScriptType,
	outputsCount: Buffer,
	outputsBuf: Buffer,
	lockTimeBuf: Buffer,
};
