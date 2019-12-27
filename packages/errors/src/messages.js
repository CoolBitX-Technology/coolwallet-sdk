export default {
  SAY_HI: {
    '6a82': {
      code: '10010',
      msg: 'Device Not Registered',
    },
  },
  REGISTER: {
    '6985': {
      code: '10004',
      msg: 'Pairing Error: Card Locked',
    },
    '6a84': {
      code: '10008',
      msg: 'Pairing Error: Max Devices Paired',
    },
    '6982': {
      code: '10007',
      msg: 'Pairing Error: Wrong Password.',
    },
    '6100': {
      code: '10006',
      msg: 'Pairing Error: Max Password Tried',
    },
    '6a80': {
      code: '10005',
      msg: 'Pairing Error: Device already registered',
    },
  },
  CREATE_WALLET: {
    '6881': {
      code: '11013',
      msg: 'WalletCreationError: Wallet Already Exists.',
    },
    '6a80': {
      code: '11014',
      msg: 'WalletCreationError: Invalid Seed Length.',
    },
  },
  FINISH_BACKUP: {
    '6984': {
      code: '11015',
      msg: 'WalletCreationError: Wrong Sum of seed',
    },
  },
  SET_SEED: {
    '6881': {
      code: '11013',
      msg: 'WalletCreationError: Wallet Already Exists.',
    },
  },
  AUTH_EXT_KEY: {
    '6881': {
      code: '11012',
      msg: "SigningError: Wallet Doesn't Exist",
    },
  },
  GET_EXT_KEY: {
    '6a86': {
      code: '11016',
      msg: "Wallet Setup Error: Don't support this CoinType",
    },
  },
  SET_CHANGE_KEYID: {
    '6985': {
      code: '30019',
      msg: 'Invalid Flow: Coin Seed not Created',
    },
  },
  TX_PREPARE: {
    '6984': {
      code: '30099',
      msg: 'Invalid Transaction Data',
    },
    '6985': {
      code: '30019',
      msg: 'Invalid Flow: Coin Seed not Created.',
    },
    '6001': {
      code: '30051',
      msg: 'Hashoutput Rawoutput Mismatch',
    },
    '6002': {
      code: '30052',
      msg: 'Output too long',
    },
    '6003': {
      code: '30053',
      msg: 'Invalid change address redeemScript.',
    },
    '6004': {
      code: '30054',
      msg: 'Change Address and Index Mismatch.',
    },
    '6005': {
      code: '41055',
      msg: 'Invalid Omni Layer Data',
    },
    '6006': {
      code: '39056',
      msg: 'Chain ID Error',
    },
    '6007': {
      code: '32032',
      msg: 'Token Address mismatch',
    },
    '6008': {
      code: '31057',
      msg: 'readType DataType Mismatch',
    },
    '6009': {
      code: '40058',
      msg: 'Side Column format error',
    },
    '60f0': {
      code: '30059',
      msg: 'Invalid RLP format',
    },
    '60f1': {
      code: '30060',
      msg: 'Invalid JSON format',
    },
    '6701': {
      code: '30061',
      msg: 'Truncated Data length and P2 Mismatch.',
    },
  },
}
