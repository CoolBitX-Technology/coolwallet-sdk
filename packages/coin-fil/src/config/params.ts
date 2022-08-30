export const COIN_TYPE = '800001CD';

interface ScriptParam {
  script: string;
  signature: string;
}

export const Transaction: ScriptParam = {
  script:
    '03000E01C70700000001CDCC07C0028a00CAA017001AA117C004001507C004CAA11700CAAC1700021AAC17C0030A00A1ACC70004301507C0341AAC17C0030B01CAACCE000430CAEC97001C1AAC17C0030B02CAACCE000430CAEC9700101AAC17C0030603CAACC7000430250E00CC07C0025501CAAC270038CAAC17004C12AC17C04D0400081507C002FF00B5AC17004DCAACB7004ECAAC1700561AAC17C05704001507C005CAAC17005712AC17C0580400101507C002FF00B5AC170058CAACB7005912AC17C0690401281507C002FF00B5AC170069CAACB7006A1AAC17C0921100CC07C0020040DC07C00346494C1507C015CAAC970093DC07C00346494CD207C005534D415254CC0EC0060171a0e402205A709EC00E250700CAE09700250E001AAC17C0030C00BAACCF6C04300D011507C089CAACCE0004301AAC17C0030501CAEC9F001C1AAC17C0030502CAEC9F00101AAC17C0030403CAE09F00CAACCF003404250E00CC0E504142434445464748494A4B4C4D4E4F505152535455565758595A3233343536371AAC17C0030701BAF0CEC11827081AAC17C0030702BAF0CEC1243A081AAC17C0030703BAF0CEC1304D08250F00CAE59F00250E00CC0E1046BAAC1E6C020D01CAF09E00DDE09700250E00250F0012AC17C0580400101507C002FF00B5AC170058DAACB7C05912D207CC05065052455353425554546F4E',
  signature:
    '304402201DB07746423C9E1D8EE51D1AFFBB884D46E576BF2FC79BB5E0D29299FC0962B5022020BE8BB3B41BC87BAFFE514D359B668BAA0BCA1DE3D7B8F8F63220DA5628B31E',
};
