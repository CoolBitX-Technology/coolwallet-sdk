export const TRANSFER = {
  script: `0400000010C7070000000000C1AC17C0290201010102BAA1C7CC08080F02C1A017C004041976A9140317A91403160014032200201AA017C00903CAAC5700091507C005CAAC270015C1A017C0040288AC018700001AAC17C0295D01BAACC7CC2B08080F02C1AC17C02A03041976A9140317A914031600146CACCF0033151AAC17C02A05005AF097C0091AAC17C02A1001CC0EC00200145AF09EC0095AE097C0091AAC17C02A05025AF097C009C1AC17C02A030288AC018700DC07C003425443250E00250F0012A017C0220001C1A01FC00201000105CAAC2F00155AF09FC00DBAF0CE6C190804DDE097001507C061CC0FC0060303000203001AA017C00B02BAAC2F5C1505081507C008BAAC5FCC09340508CC0FC0060000000000005AF09EC00B250F00CC0FC004626331711AA017C00B02BAAC2F5C150C081507C008BAAC5FCC09340C08BAE09FCC060C00DDF09700DAA1C7C00808D207CC05065052455353425554546f4e250E00CAAC6E0048`,
  signature: `00003044022054D20BC70E47EE7F5195A342F8C5D6985C82C57FE55F676AD09A9BCC383ED58D0220799D0585CBF5BD1ACEF8E5134E6B83D317DABE30C5B6868448622858B67B14A8`,
};

export const NEW_TRANSFER = {
  script: `03070D01C7070000000000CAA0C70004CAAC570004CAAC570024C4ACC7C0440402CAACC7009004BAACCECC4908080F02C1AC1EC04804041976A9140317A91403160014032200201AAC17C0480903CAAC5E00511507C005CAAC2E005DC1AC1EC048040288AC018700001AAC17C0715401BAACCECC7308080F026CACCF007B15C1AC1EC07203041976A9140317A914031600141AAC17C07205005AF09EC0091AAC17C0721301CC0FC00200145AF0CFC021095AFCCEC0211609C1AC1EC072030288AC0187005AE097C00DCAACC7009404CAACC7009804250E00250F00DC07C00342544312AC17C048230001C1AC1FC0480201000105CAAC2F005D5AF09FC00DBAF0CE6C190804DDE097001507C063CC0FC0060303001402001AAC17C0480B02BAAC2F5C5D05081507C008BAAC5FCC51340508CC0FC0060000000000005AF09EC00B250F00CC0FC004746231711AAC17C0480B02BAAC2F5C5D0C081507C008BAAC5FCC51340C08BAE09FCC060C00DDF09700DAACC7C0490808D207CC05065052455353425554546F4E`,
  signature:
    `30450221008045ebe0e3cd3acd60352be817c9accf637f7a9ffdcbf7f9c5b6b43315e40f0902204d67bd336afd02a6834f602d9d53c8f9537a47080271a9e866b11903caa89aa4`.padStart(
      144,
      '0'
    ),
};

export const USDT = {
  script: `0400000010C70700000000001AAC17C0290801CC0710031507C004CC071002BAACC7CC0702020F02CC07C006000000000000C1A017C004041976A9140317A91403160014032200201AA017C00903CAAC5700091507C005CAAC270015C1A017C0040288AC01870000CC07C0170000000000000000166a146f6d6e69000000000000001fCAACC70088081AAC17C0295D01BAACC7CC2B08080F02C1AC17C02A03041976A9140317A914031600146CACCF0033151AAC17C02A05005AF097C0091AAC17C02A1001CC0EC00200145AF09EC0095AE097C0091AAC17C02A05025AF097C009C1AC17C02A030288AC018700DC07C003425443DC07C00455534454250E00250F0012A017C0220001C1A01FC00201000105CAAC2F00155AF09FC00DBAF0CE6C190804DDE097001507C061CC0FC0060303000203001AA017C00B02BAAC2F5C1505081507C008BAAC5FCC09340508CC0FC0060000000000005AF09EC00B250F00CC0FC004626331711AA017C00B02BAAC2F5C150C081507C008BAAC5FCC09340C08BAE09FCC060C00DDF09700DAACC7C0880808D207CC05065052455353425554546F4E250E00CAAC6E0048`,
  signature: `3046022100F00D1531919F12DD236D5CE8C232E30131905211E69ECEAE6DC23CB97DEE3A9D022100B3B851796427DF36D5DC28C49D49733CEE8AAFB98A4E0B3F6E0C3729A4A553ED`,
};

export const NEW_USDT = {
  script: `03070D01C7070000000000CAA0C70004CAAC570004CAAC570024C4ACC7C0440402CAACC7009804BAACCECC4908080F02C1AC1EC04804041976A9140317A91403160014032200201AAC17C0480903CAAC5E00591507C005CAAC2E0065C1AC1EC048040288AC01870000CC0EC0170000000000000000166a146f6d6e69000000000000001fCAACCE0051081AAC17C0795401BAACCECC7B08080F026CACCF008315C1AC1EC07A03041976A9140317A914031600141AAC17C07A05005AF09EC0091AAC17C07A1301CC0FC00200145AF0CFC021095AFCCEC0211609C1AC1EC07A030288AC0187005AE097C00DCAACC7009C04CAACC700A004250E00250F00DC07C003425443DC07C0045553445412AC17C048230001C1AC1FC0480201000105CAAC2F00655AF09FC00DBAF0CE6C190804DDE097001507C063CC0FC0060303001402001AAC17C0480B02BAAC2F5C6505081507C008BAAC5FCC59340508CC0FC0060000000000005AF09EC00B250F00CC0FC004746231711AAC17C0480B02BAAC2F5C650C081507C008BAAC5FCC59340C08BAE09FCC060C00DDF09700DAACC7C0510808D207CC05065052455353425554546F4E`,
  signature:
    `3045022100f8e890c731f6d07310cd8235069419ba465b0940764ed6bee81c6282b87b74a3022008bcbd284d7c2911dca754d134d3954bc7db4a17dcf54000d455fec254dd3f81`.padStart(
      144,
      '0'
    ),
};

export const COIN_TYPE = '80000000';
