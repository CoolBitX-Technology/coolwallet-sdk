/* eslint-disable camelcase */

export type Transaction = {
  expiration:number
  ref_block_num:number
  ref_block_prefix:number
  max_net_usage_words:number
  max_cpu_usage_ms:number
  delay_sec:number,
  data: TransferData
}

export type TransferData = {
  from :string,
  to: string,
  quantity: string,
  memo: string
}
