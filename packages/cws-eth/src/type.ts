import { key } from "@coolwallet/core/lib/crypto"

export type Output = {
  address: string,
  value: number
}

export type Transaction = {
  [key: string]: any,
  chainId: number,
  nonce: string, 
  gasPrice: string, 
  gasLimit: string, 
  to: string, 
  value: string, 
  tokenInfo: {
    contractAddress: string, 
    name: string,
    symbol: string,
    decimals: string,
    rateId: string,
    setTokenPayload: string,
    isBuiltIn: boolean
  }
}

export const coinType = '3C'
