const SCRIPT = {
  TRANSFER: {
    script: `03000002C70700000001F5CAA0C70003CAAC170003CAAC570004CAAC5700241AAC57C044042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700441AAC57C064042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700641AAC57C084042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700841AAC57C0A4042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A4CAAC5700C4CC071001CAAC1700E4CAAC1700E5CAAC1700E6CAAC1700E7CAAC1700E8CAACC700E904CAACC700ED08DC07C003534F4C1AAC17C0E70B00BAAC5F6C040804DDF097001AAC17C0E70B01BAAC5F6C240804DDF09700250F00BAACCECCED08080F10DAE097C009250E00D207CC05065052455353425554546F4E`,
    signature:
      `304502201feef74de887b6d8513f56371cebf5e9d7f05e2ddbef25eb6dd91cd088910018022100d4afd1ea9d5f9ae142cdab5419e8c0974f10651376af03a141a26e49b08691dc`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
  TOKEN_TRANSFER: {
    script: `03000002C70700000001F5CAA0C70003CAAC170003CAAC570004CAAC570024CAAC570044CAAC5700641AAC57C084042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700841AAC57C0A4042D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D2D1507C005CAAC5700A4CAAC5700C4CC071001CAAC1700E4CAAC1700E5CAACC700E604CAAC1700EACAAC1700EBCAACC700EC08CAAC1700F4DC07C003534F4C11ACC7CDF52904011E1507C004CC0F104012AC17C0F60401071507C002FF00B5AC1700F6CAACBF00F7DEF09700250F00BAAC5F6C240804DDF09700250F00BAACCECCEC08080F1012AC17C0F50400141507C002FF00B5AC1700F5DAE097B0250E00D207CC05065052455353425554546F4E`,
    signature:
      `30450221008ca60fc77d2ab62548366000044c4972ae2f6cca5716472bb78483cc5064cb7b022075ad4281dc8cded2139b5cd414305d10c55c2625c9dae47ec0c5a113e8752551`.padStart(
        144,
        '0'
      ),
    get scriptWithSignature(): string {
      return this.script + this.signature;
    },
  },
};

// reference: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const COIN_TYPE = '80000310'; // 784
export { SCRIPT, COIN_TYPE };
