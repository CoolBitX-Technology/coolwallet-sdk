export enum ScriptType {
	P2PKH = 0, // 1xxx
	P2SH_P2WPKH = 1, // 3xxx
	P2WPKH = 2, // bc1 長度不同
	P2WSH = 3, // bc1
}

export type Input = {
	preTxHash: string,
	preIndex: number,
	preValue: string,
	sequence?: number,
	addressIndex: number,
	pubkeyBuf?: Buffer,
};

export type Output = {
	value: string,
	address: string,
};

export type Change = {
	value: string,
	addressIndex: number,
	pubkeyBuf?: Buffer,
};

export type PreparedData = {
	versionBuf: Buffer,
	inputsCount: Buffer,
	preparedInputs: {
		addressIndex: number,
		pubkeyBuf: Buffer,
		preOutPointBuf: Buffer,
		preValueBuf: Buffer,
		sequenceBuf: Buffer,
	}[],
	outputType: ScriptType,
	outputsCount: Buffer,
	outputsBuf: Buffer,
	lockTimeBuf: Buffer,
};
