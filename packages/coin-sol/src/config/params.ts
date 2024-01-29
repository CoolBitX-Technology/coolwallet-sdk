import base58 from 'bs58';

const SCRIPT = {
  TRANSFER: {
    script: `03000002C70700000001F5CC071001CC071000CC071001CAA01700CAA157001AA017C004021507C005CAAC570021CAAC570041CAAC570061CC0710011AA017C00802CC0710011507C004CC071002CC071002CAACC7008102CAAC170083CAACC7008404CAAC970088DC07C003534F4C1AACC7C081020F0001BAAC5F6C210804DDF097001507C00ABAA15F6C0804DDF09700250F00BAAC9ECC88080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `3045022026CCAB06DA64DEBE4CF10D8CE3C7C27946991DCC98314AE20A6EBF0A1A71F047022100D321983320786B1A5BE3270F1AC0DF8AA403875A625532FC3B9C23E181F0B2F7`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SMART_CONTRACT: {
    script: `03000002C70700000001F5CAA09700DC07C003534F4CD207C005534D415254D207CC05065052455353425554546F4E`,
    signature:
      `3045022100AFECB6EECB35BA13D924D61C3C6C468017CAE31835E59A6722CCF75E68CF788202207252A4E2777E8B289F8AE7902D0BEF521859A8C6077B2209AB7BD704C3899921`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  ASSOCIATED_TOKEN_ACCOUNT: {
    script: `03000002C70700000001F5CC071001CC0710001AA017C00808CC0710061507C004CC071005CAA01700CAA15700CAAC570021CAAC570041CAAC570061CAAC570081CAAC5700A1CAAC5700C11AA017C00508CAAC5700E1CAAD57000101CC071001CAAD17000121CC071007CAADC700012207CC071000DC07C003534F4CD207CC0507546F4B454E4143436F554E54BAAC5F6C210804DDF09700D207CC05065052455353425554546F4E`,
    signature:
      `304402207DC683D951D35D558C4556D42124B99EBA2C9C82F1C339DD53594DEBBBE94CDD022037AAF15D4446233982DF5AB8FFF89FF3385ACFC3C58852770CC80115F0E49F65`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SPL_TOKEN: {
    script: `03000002C70700000001F5CC071001CC071000CC071001CAA01700CAA15700CAAC5700211AA017C004031507C005CAAC570041CAAC570061CAAC570081CC0710011AA017C00803CC0710021507C004CC071003CC071003CAACC700A103CAAC1700A4CAAC1700A5CAACC700A608DC07C003534F4C11ACC7CCAE2904D71507C004CC0F104012AC17C0AF0401071507C002FF00B5AC1700AFCAACBF00B0DEF09700250F001AACC7C0A1030F010200BAAC5F6C410804DDF097001507C00BBAAC5F6C210804DDF09700250F00BAACCECCA608080F1012AC17C0AE0400141507C002FF00B5AC1700AEDAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `3046022100f78a37d2b2bf9ec2f40ff702dc55ff8ea8626cd41cb449aa7c76c0e0ea8f4f1c022100af7d5f8aff873ae64be31db0747086afdcf24d5d6d31464a016d074c2202dfc3`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  CREATE_AND_SPL_TOKEN: {
    script: `03000002C70700000001F5CC071001CC071000CC071006CC071009CAA05700CAA55700CAA65700CAAC570060CAAC570080CAAC5700A0CAAC5700C0CAAC5700E0CAAD57000100CAAD57000120CC071002CAAD17000140CC071007CAAD17000141CAAD17000142CAAD17000143CAADC700014404CC071000CAAD17000148CC071003CAADC700014903CC071009CAAD1700014CCAADC700014D08DC07C003534F4C11ADC7CD01552904017E1507C004CC0F104012AD17C001560401071507C002FF00B5AD17000156CAADBF000157DEF09700250F001AAD17C001430E03BAAC5F6C600804DDF09700250F001AAD17C001430E04BAAC5F6C800804DDF09700250F001AAD17C001430E05BAAC5F6CA00804DDF09700250F001AAD17C001430E06BAAC5F6CC00804DDF09700250F001AAD17C001430E07BAAC5F6CE00804DDF09700250F001AAD17C001430F08BAAD5F6C01000804DDF09700250F00BAADCECC014D08080F1012AD17C001550400141507C002FF00B5AD17000155DAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502204da918f88d8a2821e4d1cfc03fc0420d4913245258995f7214c5b1a0154cf0c1022100e3797f9c27e58a5532540d28b6580744a98ea37554c0a771a6bd3ae028d4131a`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  DELEGATE: {
    script: `03000002C70700000001F5CC071001CC071000CC071005CC071007CAA05700CAA55700CAA65700CAAC570060CAAC570080CAAC5700A0CAAC5700C0CAAC5700E0CC071001CAAD17000100CC071006CAAD17000101CAAD17000102CAADC700010304CAAD17000107CAADC700010804DC07C003534F4CDC07C0055354414B451AAD17C001020D02BAA65F6C0804DDF09700250F001AAD17C001020E03BAAC5F6C600804DDF09700250F001AAD17C001020E04BAAC5F6C800804DDF09700250F001AAD17C001020E05BAAC5F6CA00804DDF09700250F001AAD17C001020E06BAAC5F6CC00804DDF09700250F00D207CC05065052455353425554546F4E`,
    signature:
      `3046022100BED6D7F811C4B46D54D27F606665EF3430A4E1A54181B7E1DEF2B2EA53E11FC60221008213FED47888C543A7696C71D6600CEC4F38199B141DA96A76F75E11765BE2BF`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  UNDELEGATE: {
    script: `03000002CC071001CC071000CC071002CC071004CAA05700CAA55700CAA65700CAAC570060CAAC570080CC071001CAAC1700A0CC071003CAAC1700A1CAAC1700A2CAAC1700A3CC071004CC07C00405000000DC07C003534F4CDC07C005556E44656CBAA05F6C0804DDF09700D207CC05065052455353425554546F4E250F00`,
    signature:
      `3045022100EAE22E87EE31EB0556954AA33963BF18A7F3386B9DDD03BC023D7FC5018646B002203BA1E8612E1CD90345A9DB3008DC4A1D47FEA0DF82192AD8DAD833F43B039BC3`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  DELEGATE_AND_CREATE_ACCOUNT_WITH_SEED: {
    script: `03000002C70700000001F5CC071001CC071000CC071007CC071009CAA05700CAA55700CAA65700CAAC570060CAAC570080CAAC5700A0CAAC5700C0CAAC5700E0CAAD57000100CAAD57000120CC071003CAAD17000140CC071002CAADC700014102CAAD17000143CAADC70001442CCAADD7000170FFE0CAADC700019008CAADC700019828CAAD170001C0CC071002CAADC70001C102CAAD170001C3CAADC70001C474CAAD17000238CC071006CAAD17000239CAAD1700023ACAADC700023B04CAAD1700023FCAADC700024004DC07C003534F4CDC07C0055354414B451AAD17C0023A0E03BAAC5F6C600804DDF09700250F001AAD17C0023A0E04BAAC5F6C800804DDF09700250F001AAD17C0023A0E05BAAC5F6CA00804DDF09700250F001AAD17C0023A0E06BAAC5F6CC00804DDF09700250F001AAD17C0023A0E07BAAC5F6CE00804DDF09700250F001AAD17C0023A0F08BAAD5F6C01000804DDF09700250F00BAADCECC019008080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502202EFE67D03E1C4EA7FC59F4D46C17A5B6C767650B314DD1ACBF65C0304318CB35022100F9B04A407D23B75B0AF4ACE3BF444D625BB421A3ECF5819D9D1A7C38ED707632`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  STAKING_WITHDRAW: {
    script: `03000002C70700000001F5CC071001CC071000CC071003CAA01700CAA15700CAAC570021CAAC570041CAAC570061CAAC5700811AA017C00506CAAC5700A1CAAC5700C1CC071001CAAC1700E1CC071005CAAC1700E2CAAC1700E3CAACC700E403CAAC1700E7CAACC700E804CAACC700EC08DC07C003534F4CDC07C0065265776172641AAC17C0E30D00BAA15F6C0804DDF09700250F001AAC17C0E30E01BAAC5F6C210804DDF09700250F001AAC17C0E30E02BAAC5F6C410804DDF09700250F00BAACCECCEC08080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502202B00FE9B731FBA6F7C28A98EB38E82567A3728DE638A310AA8EBABA5BC2C9DE1022100EBA72B99B412083EB18BD2485124CA3D60D3BF18A7D13122395BE9AE7B10AB3B`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SIGN_IN: { //TODO: replace with real script and signature
    script: `03000002C70700000001F5CC071001CC071000CC071003CAA01700CAA15700CAAC570021CAAC570041CAAC570061CAAC5700811AA017C00506CAAC5700A1CAAC5700C1CC071001CAAC1700E1CC071005CAAC1700E2CAAC1700E3CAACC700E403CAAC1700E7CAACC700E804CAACC700EC08DC07C003534F4CDC07C0065265776172641AAC17C0E30D00BAA15F6C0804DDF09700250F001AAC17C0E30E01BAAC5F6C210804DDF09700250F001AAC17C0E30E02BAAC5F6C410804DDF09700250F00BAACCECCEC08080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502202B00FE9B731FBA6F7C28A98EB38E82567A3728DE638A310AA8EBABA5BC2C9DE1022100EBA72B99B412083EB18BD2485124CA3D60D3BF18A7D13122395BE9AE7B10AB3B`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
};

const COIN_TYPE = '800001f5';
const LAMPORTS_PER_SOL = 1000000000;
const SYSTEM_PROGRAM_ID = Buffer.alloc(32);
// token
const TOKEN_PROGRAM_ID = base58.decode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = base58.decode('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// stake
const STAKE_PROGRAM_ID = base58.decode('Stake11111111111111111111111111111111111111');
const STAKE_CONFIG_ID = base58.decode('StakeConfig11111111111111111111111111111111');

// sysvar
const SYSVAR_RENT_PUBKEY = base58.decode('SysvarRent111111111111111111111111111111111');
const SYSVAR_CLOCK_PUBKEY = base58.decode('SysvarC1ock11111111111111111111111111111111');
const SYSVAR_STAKE_HISTORY_PUBKEY = base58.decode('SysvarStakeHistory1111111111111111111111111');

const PACKET_DATA_SIZE = 1280 - 40 - 8;

export {
  SCRIPT,
  COIN_TYPE,
  LAMPORTS_PER_SOL,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  STAKE_PROGRAM_ID,
  STAKE_CONFIG_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  PACKET_DATA_SIZE,
};
