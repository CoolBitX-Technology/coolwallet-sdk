export const COIN_TYPE = '8000003c';

export const TRANSFER = {
  script: `03040601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF6CC071094CAA02700C2A2D700FFF6CC071080CC0E1019C2E09700CC07C0028080BE0710DC07C00343524FCC0FC0023078BAA02F6C0E04DDF09700DAA2D7C0FFF612D207CC05065052455353425554546F4E`,
  signature: `003045022100B3D3C5F089BFD31021357B05F769256299460DAA54B4DBD8777158C047A3729E02206078F1403E17FB750E7B4BAE197566165AC5F5061C0764F325AC7327EC2B5EB9`,
  get scriptWithSignature(): string {
    return this.script + this.signature;
  },
};

export const ERC20 = {
  script: `03040601C707000000003C11ACC7CC3C0F044B1507C002FF00A00700C2ACD70034FFF8C2A5D700FFF6C2ACD7002AFFF6CC071094CAAC27009CCC07C01380B844a9059cbb000000000000000000000000CAA02700CC07200000000000000000000000000000000000000000CAA2C7000C12AC17C03C0401061507C002FF00B5AC17003CC2ACB7003DCC07C0028080BE071012AC17C0430401071507C002FF00B5AC170043CAACBE0044DEE09700250E0011ACC7CC931D04B01507C004CC0F104012AC17C0940401071507C002FF00B5AC170094CAACBF0095DEF09700250F00CC0FC0023078BAA02F6C0E04DDF0970012AC17C0930400141507C002FF00B5AC170093DAA2C7B00CD207CC05065052455353425554546F4E`,
  signature:
    `3046022100A121463CD1D1D5263A737FDF0228D350A1C1FE77638A314A7F38FF58986EFEFA0221008E5533FC8AA33045049BF9B516AE8FA4E80627A62C085F249C81C0D777EC6F0F`.padStart(
      144,
      '0'
    ),
  get scriptWithSignature(): string {
    return this.script + this.signature;
  },
};

export const SmartContract = {
  script: `03040601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF6CC071094CAA02700C2A2D700FFF6C2AC97003ACC0E1019C2E09700CC07C0028080BE0710DC07C00343524FD207C005534D415254D207CC05065052455353425554546F4E`,
  signature:
    `3045022072902FD446A0E80824EAEF45ACCA5F800BE52AD3CE9D011AF90C8D85710059D0022100C467A0FE1BF941B4900CB269B80BD2D1999EEB5B8633676AA0383E8EDE863FA3`.padStart(
      144,
      '0'
    ),
  get scriptWithSignature(): string {
    return this.script + this.signature;
  },
};

export const SmartContractSegment = {
  script: `03050601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF6CC071094CAA02700C2A2D700FFF6C4ACC7003A04CC0E1019C2E09700CC07C0028080BE0710DC07C00343524FD207C005534D415254D207CC05065052455353425554546F4E`,
  signature:
    `3046022100A0188B33A3CCCF98BF055FB82BF621E9D43AFE7DD066D907DD446688E91141C0022100EF67E474862FA59DC5DE49079FD5258CDB6939C41C84E0170132399E1CB96592`.padStart(
      144,
      '0'
    ),
  get scriptWithSignature(): string {
    return this.script + this.signature;
  },
};
