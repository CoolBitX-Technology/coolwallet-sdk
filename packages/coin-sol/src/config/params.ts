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
      '03000002C70700000001F5CC071001CC071000CC071001CC071003CAA05700CAA55700CAA65700CAAC570060CC071001CC071002CC071002CC07C0020001CAAC170080CAACC7008104CAAC970085DC07C003534F4CBAA55F6C0804DDF09700250F00BAAC9ECC85080F10DAE097C009250E00D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
  SMART_CONTRACT: {
    script:
      '03000002C70700000001F5CC071001CC071000CC071001CC071003CAA0D700FFA0CAACD70060FFE0CC071001CC071002CC071001CC071001CAAC170080CAAC970081DC07C003534F4CD207C005534D415254D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
  SPL_TOKEN: {
    script:
      '03000002C70700000001F5CC071001CC071000CC071001CC071004CAA05700CAA55700CAA65700CAAC570060CAACD70080FFE0CC071001CC071003CC071003CC07C003020100CAAC1700A0CAAC1700A1CAAC9700A2D207CC0303534F4C53504CBAA55F6C0804DDF09700250F00BAAC9ECCA2080F10DAE097C009250E00D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
  TRANSFER_SELF: {
    script:
      '03000002C70700000001F5CC071001CC071000CC071001CC071002CAA05700CAA55700CAA65700CC071001CC071001CC071002CC07C0020000CAAC170060CAACC7006104CAAC970065DC07C003534F4CBAA05F6C0804DDF09700250F00BAAC9ECC65080F10DAE097C009250E00D207CC05065052455353425554546F4E',
    signature:
      'FA0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    getScript(): string {
      return this.script + this.signature;
    },
  },
};

export const SYSTEM_PROGRAM_ID = Buffer.alloc(32);
export const TOKEN_PROGRAM_ID = Buffer.from('06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9', 'hex');
export const LAMPORTS_PER_SOL = 1000000000;

export const COIN_TYPE = '800001f5';

export const TRANSACTION_TYPE = {
  TRANSFER: 'TRANSFER',
  TRANSFER_SELF: 'TRANSFER_SELF',
  SMART_CONTRACT: 'SMART_CONTRACT',
  SPL_TOKEN: 'SPL_TOKEN',
};
