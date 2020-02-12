export const BTC = {
  COINTYPE: '00',
  PARAMS: {
    P2WPKH: {
      READTYPE: '01',
      HASHTYPE: 0x01,
      REDEEMTYPE: '01',
    },
    P2PKH: {
      READTYPE: '00',
      HASHTYPE: 0x01,
      REDEEMTYPE: '00',
    },
    P2: '00',
    DISPLAY_P1: '01',
  },
};

export const OMNI = {
  COINTYPE: 'C8',
  PARAMS: {
    P2WPKH: {
      READTYPE: 'C8',
      HASHTYPE: 0x01,
      REDEEMTYPE: '01',
    },
    P2PKH: {
      READTYPE: 'C8',
      HASHTYPE: 0x01,
      REDEEMTYPE: '00',
    },
    P2: '00',
    DISPLAY_P1: '0A',
  },
};

export const LTC = {
  COINTYPE: '02',
  PARAMS: {
    P2WPKH: {
      READTYPE: '02',
      HASHTYPE: 0x01,
      REDEEMTYPE: '01',
    },
    P2PKH: {
      READTYPE: '00',
      HASHTYPE: 0x80,
      REDEEMTYPE: '00',
    },
    P2: '00',
    DISPLAY_P1: '06',
  },
};
