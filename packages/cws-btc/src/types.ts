export type Input = {
  txHash: string,
  outputIndex: number,
  addressIndex: number,
  address?: string,
};

export type Output = {
  value: string,
  address: string,
};

export type Change = {
  value: string,
  addressIndex: number,
  address?: string,
};
