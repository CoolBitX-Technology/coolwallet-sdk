// reference: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
// TODO implement
export const TRANSFER = {
  script: `03091305C707000001B207CAA0C70002CAAC570002CAAC570022CAAC570042C4ACC7C0620402CAAC1E0066CAACCE006702CAACCE008B08CAACCE009302CAACCE009508C1AC1EC069030120012102AA201AAC17C0690A01CAACCE006A211507C005CAAC5E006BC1AC1EC0690301AC01AB01871AAC17C09D2D01CAACCE009E08CAACCE009302CC0EC0082200000000000000CC0E10206CACCF00BE15CAF15E00250F00CC0E10acCAACCE00A602CAACCE00A8165BE09700CAACC700D308CAAC2700DBCAACC700EF08CAAC5700F7CAAD17000117DC07C0034B4153250E00250F00CC0FC0060B0113100100C1AC1EC069030100010101081AAC17C0690A01CAACCE006A211507C005CAAC5E006B1AAC17C0690B01BAE09FCC3705081507C007BAE09FCC350508CC0FC00800000000000000005AF09EC00C250F001AAC17206901BAE0CFCC22370C08BAEC9FCC22080C081507C010BAE0CFCC21350C08BAEC9FCC21080C08DDF09700250E00BAACCECC8B08080F02DAE097C008250E00D207CC05065052455353425554546F4E`,
  signature:
    `3045022018eeb3dc55bf632fc93c2bf7007a70a58b2312cfeb2ed4b26bccd5128d855f08022100af0e14aadfd7503082bec1649d8396f1438d748b5f5461e1e9b6f40d3161c0a4`.padStart(
      144,
      '0'
    ),
};

export const COIN_TYPE = '8001b207'; // 111111
