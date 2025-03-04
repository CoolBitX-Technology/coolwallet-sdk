export const COIN_TYPE = '8000018a';

export const TRANSFER = {
  script: `03030201C707000000018ACC07100aA00700CC07100aA00700CC07C01E0a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE0700CC071012A0070029AC9700C9CAAC9700C9BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a020801CC071018BFACC700C108BE0700CC071012A00700CC07100aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA9080D01BE0700BE0700CC071010BFACC700B108BE0700BE0700CC07C01C1a1A63727970746f2d6f72672d636861696e2d6d61696e6e65742d31CC071020BFACC700B908DC07C00343524FDDACD70061FFC0DAACC7C0A10808D207CC05065052455353425554546F4E`,
  signature: `00304502205507429A2145100A4D5F3F29EE3EAC2257056390036B0F36AF76FFB1264D2E410221008487F937338FDA74CEE56C659D93C8BF69E3845F6EB116C7B056124C29A2A80E`,
};

export const DELEGATE = {
  script: `03030201C707000000018ACC07100aA00700CC07100aA00700CC07C0250a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c6567617465CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE0700CC071012A0070029AC9700C9CAAC9700C9BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a020801CC071018BFACC700C108BE0700CC071012A00700CC07100aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA9080D01BE0700BE0700CC071010BFACC700B108BE0700BE0700CC07C01C1a1A63727970746f2d6f72672d636861696e2d6d61696e6e65742d31CC071020BFACC700B908DC07C00343524FDC07C00544656C6774DDACD70061FFC0DAACC7C0A10808D207CC05065052455353425554546F4E`,
  signature: `003045022100AC4C9109D4F1772F40C866220091F091E306C19EF80B886608F890CE3874112502207C5282B72D8ABA1EA6A1D8110ECE11376EB5BC242855D142057AA7C642FA9C7A`,
};

export const UNDELEGATE = {
  script: `03030201C707000000018ACC07100aA00700CC07100aA00700CC07C0270a252f636f736d6f732e7374616b696e672e763162657461312e4d7367556e64656c6567617465CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE0700CC071012A0070029AC9700C9CAAC9700C9BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a020801CC071018BFACC700C108BE0700CC071012A00700CC07100aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA9080D01BE0700BE0700CC071010BFACC700B108BE0700BE0700CC07C01C1a1A63727970746f2d6f72672d636861696e2d6d61696e6e65742d31CC071020BFACC700B908DC07C00343524FDC07C005556E44656CDDACD70061FFC0DAACC7C0A10808D207CC05065052455353425554546F4E`,
  signature: `003045022100C69BB84850469C4884CD7C549C2A3E5D01647E0D2CE18C17CC2A29EE3426096102204CB8F05FBF30360D3AEDBCF7DB1D884AE6BD48F3D00F80EE213F33EDAF206BF6`,
};

export const WITHDRAW = {
  script: `03030201C707000000018ACC07100aA00700CC07100aA00700CC07C0390a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002BE0700BE0700CC071012A0070029AC9700C1CAAC9700C1BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a020801CC071018BFACC700B908BE0700CC071012A00700CC07100aA00700CC07C0090a076261736563726fCC071012A00700BAACC76CA1080D01BE0700BE0700CC071010BFACC700A908BE0700BE0700CC07C01C1a1A63727970746f2d6f72672d636861696e2d6d61696e6e65742d31CC071020BFACC700B108DC07C00343524FDC07C006526577617264DDACD70061FFC0D207CC05065052455353425554546F4E`,
  signature: `003045022100B7EFF2B51BE50D9D7111F94938304D7B10EE3E4DCC021C18675A19F8814C6B9C02206DA3EB9D3639B0291C0AB3769BA65D0A6A10B92632F7C337BE481CCD1E18E3CC`,
};

export enum TX_TYPE_URL {
  MSG_SEND = '/cosmos.bank.v1beta1.MsgSend',
  MSG_DELEGATE = '/cosmos.staking.v1beta1.MsgDelegate',
  MSG_UNDELEGATE = '/cosmos.staking.v1beta1.MsgUndelegate',
  MSG_WITHDRAW = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
}
