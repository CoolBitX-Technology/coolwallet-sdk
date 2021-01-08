
export const coinType = '76'

export enum CHAIN_ID {
  ATOM = 'cosmoshub-3',
}

export enum TX_TYPE {
  SEND = 'MsgSend', 
  DELEGATE = 'MsgDelegate', 
  UNDELEGATE = 'MsgUndelegate', 
  WITHDRAW = 'MsgWithdrawDelegationReward',
}
