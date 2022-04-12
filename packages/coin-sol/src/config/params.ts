import base58 from 'bs58';

/* eslint-disable max-len */
type script = {
  [key: string]: {
    script: string;
    signature: string;
    getScript: () => string;
  };
};

export const SCRIPT: script = {
  TRANSFER: {
    script:
      '03000002C70700000001F5CC071001CC071000CC071001CAA01700CAA157001AA017C004021507C005CAAC570021CAAC570041CAAC570061CC0710011AA017C00802CC0710011507C004CC071002CC071002CAACC7008102CAAC170083CAACC7008404CAAC970088DC07C003534F4C1AACC7C081020F0001BAAC5F6C210804DDF097001507C00ABAA15F6C0804DDF09700250F00BAAC9ECC88080F10DAE097C009250E00D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
  SMART_CONTRACT: {
    script: '03000002C70700000001F5CAA09700DC07C003534F4CD207C005534D415254D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
  SPL_TOKEN: {
    script:
      '03000002C70700000001F5CC071001CC071000CC071001CAA01700CAA15700CAAC5700211AA017C004031507C005CAAC570041CAAC570061CAAC570081CC0710011AA017C00803CC0710021507C004CC071003CC071003CAACC700A103CAAC1700A4CAAC1700A5CAACC700A608D207CC0303534F4C53504C1AACC7C0A1030F010200BAAC5F6C410804DDF097001507C00BBAAC5F6C210804DDF09700250F00BAACCECCA608080F1012AC17C0AE0400141507C002FF00B5AC1700AEDAE097B0250E00D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
};

export const COIN_TYPE = '800001f5';
export const LAMPORTS_PER_SOL = 1000000000;
export const SYSTEM_PROGRAM_ID = Buffer.alloc(32);
export const TOKEN_PROGRAM_ID = base58.decode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const SYSVAR_RENT_PUBKEY = base58.decode('SysvarRent111111111111111111111111111111111');
export const ASSOCIATED_TOKEN_PROGRAM_ID = base58.decode('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export const TRANSACTION_TYPE = {
  TRANSFER: 'TRANSFER',
  SPL_TOKEN: 'SPL_TOKEN',
  SMART_CONTRACT: 'SMART_CONTRACT',
};

export const PACKET_DATA_SIZE = 1280 - 40 - 8;
