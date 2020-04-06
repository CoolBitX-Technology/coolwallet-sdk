export enum ScriptType {
	P2PKH = 'P2PKH',
	P2SH_P2WPKH = 'P2SH_P2WPKH',
	P2WPKH = 'P2WPKH',
}

export type Input = {
  preTxHash: string,
  preIndex: number,
  preValue: string,
  sequence: number,
  addressIndex: number,
};

export type Output = {
  value: string,
  address: string,
};

export type Change = {
  value: string,
  addressIndex: number,
};
