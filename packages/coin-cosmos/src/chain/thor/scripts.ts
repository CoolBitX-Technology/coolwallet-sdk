import { ScriptProps, ScriptKinds } from "../base";
const SCRIPTS: Record<ScriptKinds, ScriptProps> = {
  TRANSFER: {
    script: `03040201C70700000003A311ADC7CD017D3B0401B81507C002FF00CC07100aA00700CC07100aA00700CC07100aCC07C00F0e2f74797065732e4d736753656e64CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101a11ACC7CCC91204DB1507C002FF00A00700CC07100aBFACD7C0CAFFF602CC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE07001AAD17C0020004001507C02BCC071012A0070012AD17C0020004017F1507C002FF00B5AD1700020029ADB7000201CAADB7000201BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a0208011AACC7C0C1080400000000000000001507C00ACC071018BFACC700C108BE0700CC071012A00700CC071010BFACC700B108BE0700BE0700CC07101a12AD17C0017D0401321507C002FF00B5AD1700017DBFADB7C0017E02CC071020BFACC700B90812AD17C001B00401071507C002FF00B5AD170001B0DEADB70001B1DEACD700D4FFF9250F00CC0FC009030303030014080f12BAACDF5C61FFC00508CC0FC0060000000000005AF09EC00B250F00BAE09FCC060C00250E00CC0EC00574686F7231BAACDE5C61FFC00C08CAF09E00DDE0970012AC17C0C90401181507C002FF00B5AC1700C9DAACC7B0A108D207CC05065052455353425554546F4E`,
    signature: `304602210090A7D58DF44071D6A786C110606984212A1789E1ED60AF239F2FDF173A514CDB0221008997793F8D69538D93659487E9F9694083C6A1086E1E4AF69BCB7013C57E0098`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  DELEGATE: {
    script: `03040201C70700000003A311ADC7CD017D3B0401B81507C002FF00CC07100aA00700CC07100aA00700CC07100aCC07C024232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c6567617465CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101a11ACC7CCC91204DB1507C002FF00A00700CC07100aBFACD7C0CAFFF602CC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE07001AAD17C0020004001507C02BCC071012A0070012AD17C0020004017F1507C002FF00B5AD1700020029ADB7000201CAADB7000201BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a0208011AACC7C0C1080400000000000000001507C00ACC071018BFACC700C108BE0700CC071012A00700CC071010BFACC700B108BE0700BE0700CC07101a12AD17C0017D0401321507C002FF00B5AD1700017DBFADB7C0017E02CC071020BFACC700B90812AD17C001B00401071507C002FF00B5AD170001B0DEADB70001B1DEACD700D4FFF9DC07C00544656C6774250F00CC0FC009030303030014080f12BAACDF5C61FFC00508CC0FC0060000000000005AF09EC00B250F00BAE09FCC060C00250E00CC0EC00574686F7231BAACDE5C61FFC00C08CAF09E00DDE0970012AC17C0C90401181507C002FF00B5AC1700C9DAACC7B0A108D207CC05065052455353425554546F4E`,
    signature: `304602210098856ED02D69BF799EE2E738D09DA3D2E2DB0CB7BDDC287C8975F288BDF2E7F8022100E8526D3E9E2F3DB8B41556FA030F863A5909451B7B19AEDEB21EA8A5DAAFC48B`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  UNDELEGATE: {
    script: `03040201C70700000003A311ADC7CD017D3B0401B81507C002FF00CC07100aA00700CC07100aA00700CC07100aCC07C026252f636f736d6f732e7374616b696e672e763162657461312e4d7367556e64656c6567617465CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002CC07101a11ACC7CCC91204DB1507C002FF00A00700CC07100aBFACD7C0CAFFF602CC071012A00700BAACC76CA1080D01BE0700BE0700BE0700BE07001AAD17C0020004001507C02BCC071012A0070012AD17C0020004017F1507C002FF00B5AD1700020029ADB7000201CAADB7000201BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a0208011AACC7C0C1080400000000000000001507C00ACC071018BFACC700C108BE0700CC071012A00700CC071010BFACC700B108BE0700BE0700CC07101a12AD17C0017D0401321507C002FF00B5AD1700017DBFADB7C0017E02CC071020BFACC700B90812AD17C001B00401071507C002FF00B5AD170001B0DEADB70001B1DEACD700D4FFF9DC07C005556E44656C250F00CC0FC009030303030014080f12BAACDF5C61FFC00508CC0FC0060000000000005AF09EC00B250F00BAE09FCC060C00250E00CC0EC00574686F7231BAACDE5C61FFC00C08CAF09E00DDE0970012AC17C0C90401181507C002FF00B5AC1700C9DAACC7B0A108D207CC05065052455353425554546F4E`,
    signature: `000030440220153184B7ED6CDAB0B379E78814CC8789C65B1D3A6B6A18F8047C8DAF0D3D7D0302204C736D271C6674CCD63D507CBBAF4A85D3D376277999CBC309415286560F95D3`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  WITHDRAW: {
    script: `03030201C70700000003A311ADC7CD017D3B0401B81507C002FF0011ACC7CCC91204DB1507C002FF00CC07100aA00700CC07100aA00700CC07100aCC07C038372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264CC071012A00700CC07100aBFACD7C021FFC002CC071012BFACD7C061FFC002BE0700BE07001AAD17C0020004001507C02BCC071012A0070012AD17C0020004017F1507C002FF00B5AD1700020029ADB7000201CAADB7000201BE0700BE0700CC071012A00700CC07100aA00700CC07C0270a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21CAA0C70021CC07C00612040a0208011AACC7C0C1080400000000000000001507C00ACC071018BFACC700C108BE0700CC071012A00700CC071010BFACC700B108BE0700BE0700CC07101a12AD17C0017D0401321507C002FF00B5AD1700017DBFADB7C0017E02CC071020BFACC700B90812AD17C001B00401071507C002FF00B5AD170001B0DEADB70001B1DEACD700D4FFF9DC07C006526577617264DDACD70061FFC0D207CC05065052455353425554546F4E`,
    signature: `3046022100C6C667D1F92B73957EFC75E93E1E8887AF7BAD4D67E95925466430609E15A2E9022100CDA55861CBD7DB6EF9A883A55B1E81E5F499D10F514C0C21F5F0FBA746637D95`,
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
};
export { SCRIPTS };
