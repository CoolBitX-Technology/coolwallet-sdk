export type input = {
  txId:string,
  vout:number,
  value:number,
  redeemScript:string,
  publicKey:string,
  addressIndex:number
};

export type output = {
  address: string,
  value: number
}
