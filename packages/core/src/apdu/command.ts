export type CommandType = {
  CLA: string,
  INS: string,
  P1: string | undefined,
  P2: string | undefined
};


export const commands = {
  ECHO: {
    CLA: '80',
    INS: '68',
    P1: '00',
    P2: '00'
  },
  REGISTER: {
    CLA: '80',
    INS: '10',
    P1: undefined,
    P2: '00'
  },
  SAY_HI: {
    CLA: '80',
    INS: '50',
    P1: '00',
    P2: '00'
  },
  CHANGE_PAIR_STATUS: {
    CLA: '80',
    INS: '14',
    P1: undefined,
    P2: '00'
  },
  GET_PAIRED_DEVICES: {
    CLA: '80',
    INS: '18',
    P1: '00',
    P2: '00'
  },
  REMOVE_DEVICES: {
    CLA: '80',
    INS: '1C',
    P1: '00',
    P2: '00'
  },
  RENAME_DEVICES: {
    CLA: '80',
    INS: '1E',
    P1: '00',
    P2: '00'
  },
  GET_READTYPE: {
    CLA: '80',
    INS: '0A',
    P1: '00',
    P2: '00'
  },
  UPDATE_READTYPE: {
    CLA: '80',
    INS: '0C',
    P1: '00',
    P2: '00'
  },
  GET_NONCE: {
    CLA: '80',
    INS: '54',
    P1: '00',
    P2: '00'
  },
  SET_CHANGE_KEYID: {
    CLA: '80',
    INS: '40',
    P1: undefined,
    P2: '00'
  },
  TX_PREPARE: {
    CLA: '80',
    INS: '32',
    P1: undefined,
    P2: undefined
  },
  SEND_SCRIPT: {
    CLA: '80',
    INS: 'AC',
    P1: '00',
    P2: '00'
  },
  EXECUTE_SCRIPT: {
    CLA: '80',
    INS: 'A2',
    P1: '00',
    P2: '00'
  },
  EXECUTE_UTXO_SCRIPT: {
    CLA: '80',
    INS: 'A4',
    P1: '00',
    P2: '00'
  },
  GET_SIGNED_HEX: {
    CLA: '80',
    INS: 'A6',
    P1: '00',
    P2: '00',
  },
  TX_PREPARE_FOR_TESTNET: {
    CLA: '80',
    INS: '42',
    P1: undefined,
    P2: undefined
  },
  FINISH_PREPARE: {
    CLA: '80',
    INS: '34',
    P1: '00',
    P2: '00'
  },
  GET_TX_KEY: {
    CLA: '80',
    INS: '3A',
    P1: '00',
    P2: '00'
  },
  GET_TX_DETAIL: {
    CLA: '80',
    INS: '36',
    P1: '00',
    P2: '00'
  },
  CLEAR_TX: {
    CLA: '80',
    INS: '30',
    P1: '00',
    P2: '00'
  },
  SET_SEED: {
    CLA: '80',
    INS: '2A',
    P1: '00',
    P2: '00'
  },
  AUTH_EXT_KEY: {
    CLA: '80',
    INS: '2C',
    P1: '00',
    P2: '00'
  },
  GET_EXT_KEY: {
    CLA: '80',
    INS: '28',
    P1: undefined,
    P2: undefined
  },
  GET_ED25519_ACC_PUBKEY: {
    CLA: '80',
    INS: '94',
    P1: undefined,
    P2: undefined
  },
  GET_XLM_ACC_PUBKEY: {
    CLA: '80',
    INS: '96',
    P1: undefined,
    P2: undefined
  },
  CREATE_WALLET: {
    CLA: '80',
    INS: '24',
    P1: '00',
    P2: '00'
  },
  CHECKSUM: {
    CLA: '80',
    INS: '2E',
    P1: '00',
    P2: '00'
  },
  RESET_PAIR: {
    CLA: '80',
    INS: '56',
    P1: '00',
    P2: '00'
  },
  GET_CARD_INFO: {
    CLA: '80',
    INS: '66',
    P1: '00',
    P2: '00'
  },
  UPDATE_BALANCE: {
    CLA: '80',
    INS: '60',
    P1: '00',
    P2: '00'
  },
  GET_PAIR_PWD: {
    CLA: '80',
    INS: '1A',
    P1: '00',
    P2: '00'
  },
  UPDATE_KEYID: {
    CLA: '80',
    INS: '6A',
    P1: '00',
    P2: '00'
  },
  GET_KEYID: {
    CLA: '80',
    INS: '6C',
    P1: undefined,
    P2: '00'
  },
  SHOW_FULL_ADDRESS: {
    CLA: '80',
    INS: '64',
    P1: undefined,
    P2: '00'
  },
  GET_SE_VERSION: {
    CLA: '80',
    INS: '52',
    P1: '00',
    P2: '00'
  },
  GET_MCU_VERSION: {
    CLA: 'FF',
    INS: '70',
    P1: '00',
    P2: '00'
  },
  START_UPDATE: {
    CLA: '7F',
    INS: '01',
    P1: '00',
    P2: '00'
  },
  FINISH_UPDATE: {
    CLA: '7F',
    INS: '02',
    P1: '00',
    P2: '00'
  },
  PWR_OFF: {
    CLA: '7F',
    INS: '80',
    P1: '00',
    P2: '00'
  },
  CANCEL_APDU: {
    CLA: '7F',
    INS: '00',
    P1: '00',
    P2: '00'
  },
  CHECK_FW_STATUS: {
    CLA: 'FF',
    INS: '70',
    P1: '00',
    P2: '00'
  },
  SEND_FW_SIGN: {
    CLA: 'FF',
    INS: '80',
    P1: '00',
    P2: '00'
  },
  FW_RESET: {
    CLA: 'FF',
    INS: '6F',
    P1: '00',
    P2: '00'
  },
  FW_UPDATE: {
    CLA: 'FF',
    INS: '6F',
    P1: undefined,
    P2: undefined
  },
  SELECT_APPLET: {
    CLA: '00',
    INS: 'A4',
    P1: '04',
    P2: '00'
  },
  SET_ERC20_TOKEN: {
    CLA: '80',
    INS: '3E',
    P1: '00',
    P2: '00'
  },
  SET_SECOND_ERC20_TOKEN: {
    // for 0x typed data
    CLA: '80',
    INS: '4E',
    P1: '00',
    P2: '00'
  },
  BACKUP_REGISTER_DATA: {
    CLA: '80',
    INS: '80',
    P1: '00',
    P2: '00'
  },
  RECOVER_REGISER_DATA: {
    CLA: '80',
    INS: '82',
    P1: '00',
    P2: '00'
  },
  CHECK_BACKUP_RECOVER: {
    CLA: '80',
    INS: '86',
    P1: '00',
    P2: '00'
  },
  DELETE_REGISTER_BACKUP: {
    CLA: '80',
    INS: '84',
    P1: '00',
    P2: '00'
  },
  SC_SEND_SEGMENT: {
    CLA: '80',
    INS: 'CC',
    P1: undefined,
    P2: undefined
  },
  MCU_SET_MNEMONIC_INFO: {
    CLA: "7F",
    INS: "10",
    P1: undefined,
    P2: "00"
  },
  MCU_SET_CHARACTER_ID: {
    CLA: "7F",
    INS: "11",
    P1: undefined,
    P2: "00"
  },
  MCU_CANCEL_RECOVERY: {
    CLA: "7F",
    INS: "12",
    P1: undefined,
    P2: "00"
  },
  GET_MCU_STATUS: {
    CLA: "7F",
    INS: "13",
    P1: "00",
    P2: "00"
  }
};
