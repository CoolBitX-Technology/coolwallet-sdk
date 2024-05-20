import base58 from 'bs58';

const SCRIPT = {
  TRANSFER: {
    script: `03000002C70700000001F5CC071001CC071000CC071001CAA01700CAA15700CAAC5700211AAC57C041042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700411AAC57C061042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700611AAC57C081042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700811AAC57C0A1042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A1CAAC5700C1CC071001CAAC1700E1CAAC1700E2CAAC1700E3CAAC1700E4CAAC1700E5CAACC700E604CAACC700EA08DC07C003534F4C1AAC17C0E40A00BAA15F6C0804DDF097001AAC17C0E40B01BAAC5F6C210804DDF09700250F00BAACCECCEA08080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502201feef74de887b6d8513f56371cebf5e9d7f05e2ddbef25eb6dd91cd088910018022100d4afd1ea9d5f9ae142cdab5419e8c0974f10651376af03a141a26e49b08691dc`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  TRANSFER_WITH_COMPUTE_BUDGET: {
    script: `03000002C70700000001F5CC071001CC071000CC071002CAA01700CAA15700CAAC5700211AAC57C041042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700411AAC57C061042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700611AAC57C081042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700811AAC57C0A1042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A1CAAC5700C1CC071003CAAC1700E1CAAC1700E2CAAC1700E3CAAC1700E4CAACC700E508CAAC1700EDCAAC1700EECAAC1700EFCAAC1700F0CAACC700F104CAAC1700F5CAAC1700F6CAAC1700F7CAAC1700F8CAAC1700F9CAACC700FA04CAACC700FE08DC07C003534F4C1AAC17C0F80A00BAA15F6C0804DDF097001AAC17C0F80B01BAAC5F6C210804DDF09700250F00BAACCECCFE08080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `3044022032851d9ca464de5ae92c063f33ada384fa0dee27d6e3d469197a367ef9cc9cbe0220137ffa77407186912ffbb5fd74529b3818c7e8fa1d4eb13d4a924a44cb7caaf9`.padStart(
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
  SPL_TOKEN: {
    script: `03000002C70700000001F5CC071001CC071000CC071002CAA01700CAA15700CAAC570021CAAC570041CAAC5700611AAC57C081042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700811AAC57C0A1042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A1CAAC5700C1CC071001CAAC1700E1CAAC1700E2CAACC700E304CAAC1700E7CAAC1700E8CAACC700E908CAAC1700F1DC07C003534F4C11ACC7CDF22904011B1507C004CC0F104012AC17C0F30401071507C002FF00B5AC1700F3CAACBF00F4DEF09700250F00BAAC5F6C210804DDF09700250F00BAACCECCE908080F1012AC17C0F20400141507C002FF00B5AC1700F2DAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `30450221008ca60fc77d2ab62548366000044c4972ae2f6cca5716472bb78483cc5064cb7b022075ad4281dc8cded2139b5cd414305d10c55c2625c9dae47ec0c5a113e8752551`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SPL_TOKEN_WITH_COMPUTE_BUDGET: {
    script: `03000002C70700000001F5CC071001CC071000CC071003CAA01700CAA15700CAAC570021CAAC570041CAAC5700611AAC57C081042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700811AAC57C0A1042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A1CAAC5700C1CC071003CAAC1700E1CAAC1700E2CAAC1700E3CAAC1700E4CAACC700E508CAAC1700EDCAAC1700EECAAC1700EFCAAC1700F0CAACC700F104CAAC1700F5CAAC1700F6CAACC700F704CAAC1700FBCAAC1700FCCAACC700FD08CAAD17000105DC07C003534F4C11ADC7CD01062904012F1507C004CC0F104012AD17C001070401071507C002FF00B5AD17000107CAADBF000108DEF09700250F00BAAC5F6C210804DDF09700250F00BAACCECCFD08080F1012AD17C001060400141507C002FF00B5AD17000106DAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `3046022100f7bcc7b763b598a4aa43ace333e3416b45307190b5e9bcff45c9415d3caf4ee8022100bb990f958b7c12f13bd25b8ad5f5cd1a49cd89d4cae9f45b85adff699f747285`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  CREATE_AND_SPL_TOKEN: {
    script: `03000002C70700000001F5CC071001CC071000CC071005CAA01700CAA15700CAAC570021CAAC570041CAAC570061CAAC570081CAAC5700A1CAAC5700C1CAAC5700E11AAD57C00101042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C006CAAD57000101CAAD57000121CC071002CAAD17000141CAAD17000142CAADC700014306CAAD17000149CAAD1700014ACAAD1700014BCAADC700014C04CAAD17000150CAAD17000151CAADC700015208CAAD1700015ADC07C003534F4C11ADC7CD015B290401841507C004CC0F104012AD17C0015C0401071507C002FF00B5AD1700015CCAADBF00015DDEF09700250F00BAAC5F6C210804DDF09700250F00BAADCECC015208080F1012AD17C0015B0400141507C002FF00B5AD1700015BDAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `30460221009d7b2401e110fd30b7db32f60bbc0aefd1d2ff71a75f470c005348f59ce113080221009dd281a9dd7951e93013787694433dc74104a4dd663cf7c5d8c2a6be4335fcdf`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  CREATE_AND_SPL_TOKEN_WITH_COMPUTE_BUDGET: {
    script: `03000002C70700000001F5CC071001CC071000CC071006CAA01700CAA15700CAAC570021CAAC570041CAAC570061CAAC570081CAAC5700A1CAAC5700C1CAAC5700E11AAD57C00101042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C006CAAD57000101CAAD57000121CC071004CAAD17000141CAAD17000142CAADC700014306CAAD17000149CAAD1700014ACAAD1700014BCAAD1700014CCAAD1700014DCAADC700014E08CAAD17000156CAAD17000157CAAD17000158CAAD17000159CAADC700015A04CAAD1700015ECAAD1700015FCAADC700016004CAAD17000164CAAD17000165CAADC700016608CAAD1700016EDC07C003534F4C11ADC7CD016F290401981507C004CC0F104012AD17C001700401071507C002FF00B5AD17000170CAADBF000171DEF09700250F00BAAC5F6C210804DDF09700250F00BAADCECC016608080F1012AD17C0016F0400141507C002FF00B5AD1700016FDAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `304402205b763b3e3dc745dadda5f6fbddd2af9990bcc0fd7b32a1ab97d4af14d31ae6230220203177f933a507026a145c796ea8b4b1fe221eda157f0dda28bdb7290da9ee53`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  UNDELEGATE: {
    script: `03000002C70700000001F5CAA0C70003CAAC170003CAAC570004CAAC570024CAAC570044CAAC5700641AAC57C084042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC570084CAAC5700A4CAAC1700C41AAC17C0C704001507C01ACAAC1700C5CAAC1700C6CAAC1700C7CAAC1700C8CAACC700C9081AAC17C0D304001507C01ACAAC1700D1CAAC1700D2CAAC1700D3CAAC1700D4CAACC700D504CAAC1700D9CAAC1700DACAACC700DB03CAAC1700DECAACC700DF04DC07C003534F4CDC07C005556E44656CBAAC5F6C040804DDF09700D207CC05065052455353425554546F4E250F00`,
    signature:
      `3044022040054884f42bb7257f16c9cc121f15d2466ce8d9efb5e83f7b96973ed29d1f260220328d320b2ce9339123d923e3a2d81ffb6382a3588da19e93d8795d0265dfe561`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  DELEGATE_AND_CREATE_ACCOUNT_WITH_SEED: {
    script: `03000002C70700000001F5CAA0C70003CAAC170003CAAC570004CAAC570024CAAC570044CAAC570064CAAC570084CAAC5700A4CAAC5700C4CAAC5700E4CAAD570001041AAD57C00124042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C006CAAD57000124CAAD57000144CAAD170001641AAD17C0016704001507C01FCAAD17000165CAAD17000166CAAD17000167CAAD17000168CAADC7000169081AAD17C0017304001507C01FCAAD17000171CAAD17000172CAAD17000173CAAD17000174CAADC700017504CAAD17000179CAAD1700017ACAADC700017B02CAAD1700017DCAADC700017E04CAAD57000182CAADC70001A204CAADC70001A604CAADD70001AAFFE0CAADC70001CA08CAADC70001D208CAAD570001DACAAD170001FACAAD170001FBCAADC70001FC02CAAD170001FECAADC70001FF74CAAD17000273CAAD17000274CAAD17000275CAAD17000276CAADC700027704CAAD1700027BCAADC700027C04DC07C003534F4CDC07C0055354414B45BAAC5F6C640804DDF09700250F00BAADCECC01CA08080F10DAE097C009D207CC05065052455353425554546F4E250F00`,
    signature:
      `3044022026ea0b1c5ab42fc52fa4542db17b9a0a92b42ffc941a53b82ec8cedd7fa4fd1d02200b2edd468c0d6761add53a597774cdc1c5d1599b186a1ade4b2458c559771411`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  STAKING_WITHDRAW: {
    script: `03000002C70700000001F5CAA0C70003CAAC170003CAAC570004CAAC570024CAAC570044CAAC570064CAAC5700841AAC57C0A4042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A41AAC57C0C4042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700C4CAAC5700E4CAAD170001041AAD17C0010704001507C01FCAAD17000105CAAD17000106CAAD17000107CAAD17000108CAADC7000109081AAD17C0011304001507C01FCAAD17000111CAAD17000112CAAD17000113CAAD17000114CAADC700011504CAAD17000119CAAD1700011ACAAD1700011BCAAD1700011CCAADC700011D03CAAD17000120CAADC700012104CAADC700012508DC07C003534F4CDC07C0065265776172641AAD17C0011C0E00BAAC5F6C040804DDF09700250F001AAD17C0011C0E01BAAC5F6C240804DDF09700250F001AAD17C0011C0E02BAAC5F6C440804DDF09700250F00BAADCECC012508080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304402200329a67f8ce88f59b5dc7514488c07434fe0dc05cf9e25f151d964fff052eed102204ef7f0b5ae72bf209f093968bbaa48aeda3216103f04667cc6481fd49d82defc`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SIGN_IN: {
    script: `03000002C70700000001F5B5A01700CAA1B700CC07C0302077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a0a6CADCF00048311BAF0976C0804B5ACC7008102CAACB70083DC07C003534F4CD207C0075349474E20494ED207CC05065052455353425554546F4E`,
    signature:
      `3045022100ce2624f80ac5234d77415ca9df9ad153fa1c8baea28497d937e619ce63dddb6302205bb1f1d8aa5a47e5c87c615be03cf0a375c40ed3e19746e3279fd74dbddca82a`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  SIGN_MESSAGE: {
    script: `03000002C70700000001F5CAA09700DC07C003534F4CD207C0074D455353414745D207CC05065052455353425554546F4E`,
    signature:
      `30450220482a5109dd908b886d4b8cd8b4bfb43a56c65232d68e4b30798d3cdbb55e31f3022100ee6e9c3d9468a8ad29ca6ac2b08719c7cbe7e857951a1b7ffa62e3445bc1bb10`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  MULTI_SIGN_TX: {
    script: ``,
    signature: ``.padStart(144, '0'),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
};

const COIN_TYPE = '800001f5';
const LAMPORTS_PER_SOL = 1000000000;
const SYSTEM_PROGRAM_ID = base58.decode('11111111111111111111111111111111');
// token
const TOKEN_PROGRAM_ID = base58.decode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = base58.decode('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const ASSOCIATED_TOKEN_PROGRAM_ID = base58.decode('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// stake
const STAKE_PROGRAM_ID = base58.decode('Stake11111111111111111111111111111111111111');
const STAKE_CONFIG_ID = base58.decode('StakeConfig11111111111111111111111111111111');

// sysvar
const SYSVAR_RENT_PUBKEY = base58.decode('SysvarRent111111111111111111111111111111111');
const SYSVAR_CLOCK_PUBKEY = base58.decode('SysvarC1ock11111111111111111111111111111111');
const SYSVAR_STAKE_HISTORY_PUBKEY = base58.decode('SysvarStakeHistory1111111111111111111111111');

const COMPUTE_BUDGET_PROGRAM_ID = base58.decode('ComputeBudget111111111111111111111111111111');

const PADDING_PUBLICKEY = Buffer.from('--------------------------------', 'ascii').toString('hex');

const PACKET_DATA_SIZE = 1280 - 40 - 8;

const VERSION_PREFIX_MASK = 0x7f;

export const SIGNATURE_LENGTH_IN_BYTES = 64;

/**
 * Size of public key in bytes
 */
const PUBLIC_KEY_LENGTH = 32;

export {
  SCRIPT,
  COIN_TYPE,
  LAMPORTS_PER_SOL,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  STAKE_PROGRAM_ID,
  STAKE_CONFIG_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  COMPUTE_BUDGET_PROGRAM_ID,
  PADDING_PUBLICKEY,
  PACKET_DATA_SIZE,
  VERSION_PREFIX_MASK,
  PUBLIC_KEY_LENGTH,
};
