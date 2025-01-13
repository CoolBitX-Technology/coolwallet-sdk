import { ChainProps } from '../types';

export default class CustomEvm extends ChainProps {
  id = -1;
  symbol = '';
  signature = '';
  tokens = {};

  scripts = {
    signTransaction: {
      script: `03040601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF6CC071094CAA02700C2A2D700FFF6CC07108012AC17C03A0401061507C002FF00B5AC17003AC2ACB7003BCC07C0028080BE0710CC0F106312AC17C03A0401061507C002FF00B5AC17003ACAACBE003BBAE09F6C0D04DEF09700250E00250F00CC0FC0023078BAA02F6C0E04DDF09700DAA2D7C0FFF612D207CC05065052455353425554546F4E`,
      signature: `30450220139187cbe56bd0338fe28b8afeea6880fe0e4a2df26436be074eb527c95f85170221008373a3ee87178a4bce4caedeee955fcfead319d5e951552580f0ef486a0d8671`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signERC20Transaction: {
      script: `03040601C707000000003CA00700C2ACD70034FFF8C2A5D700FFF6C2ACD7002AFFF6CC071094CAAC27004CCC07C01380B844a9059cbb000000000000000000000000CAA02700CC07200000000000000000000000000000000000000000CAA2C7000C12AC17C03C0401061507C002FF00B5AC17003CC2ACB7003DCC07C0028080BE0710CC0F106312AC17C03C0401061507C002FF00B5AC17003CCAACBE003DBAE09F6C0D04DEF09700250E00250F00CC0F104012AC17C0440401071507C002FF00B5AC170044CAACBF0045DEF09700250F00CC0FC0023078BAA02F6C0E04DDF0970012AC17C0430400141507C002FF00B5AC170043DAA2C7B00CD207CC05065052455353425554546F4E`,
      signature: `3045022100c36a14ef60bea98590119a621c84fc5962f0e232c5c675a66667617be6403cb2022056cdb47788be550ec25f05474672cdaf115ceffba2a13fb31ab35bd8d7c14c44`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signSmartContractTransaction: {
      script: `03040601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF61AA027C0080000000000000000000000000000000000000000CC0710801507C008CC071094CAA02700C2A2D700FFF6C2AC97004112AC17C03A0401061507C002FF00B5AC17003AC2ACB7003BCC07C0028080BE0710CC0F106312AC17C03A0401061507C002FF00B5AC17003ACAACBE003BBAE09F6C0D04DEF09700250E00250F00D207C005534D415254D207CC05065052455353425554546F4E`,
      signature: `30450221008bd26f2ae80c316b678433e8e9fa4a1e04d6d87dd1a7be33f7f68867df0c30dd0220708aa67f90928e100ec03c4d350e5c71f96430493d7c86c04171cc105b91811c`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signSmartContractSegmentTransaction: {
      script: `03050601C707000000003CA00700C2ACD70032FFF8C2ACD7001EFFF6C2ACD70028FFF61AA027C0080000000000000000000000000000000000000000CC0710801507C008CC071094CAA02700C2A2D700FFF6C4ACC7003A0412AC17C03E0401061507C002FF00B5AC17003EC2ACB7003FCC07C0028080BE0710CC0F106312AC17C03E0401061507C002FF00B5AC17003ECAACBE003FBAE09F6C0D04DEF09700250E00250F00D207C005534D415254D207CC05065052455353425554546F4E`,
      signature: `304502203ec212a7a74ddecfd09b1992ebb6244a3a7643ea5a9326926de91d9a499b0938022100d37fe100a50cc51537d8ba910d697ba660c75f239ef9190fa7493b28a5d4183e`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signTypedData: {
      script: `03000601C707000000003CCC07C0021901CAA057005AAC97C02706CC0F106312A517C00401061507C002FF00B5A51700CAACBE0021BAE09F6C0D04DEF09700250E00250F00D207C006454950373132D207CC05065052455353425554546F4E`,
      signature: `3046022100edb220ef5f538f9a581c91c81502d369322d03d4eeac29e5926438827a1a14dc02210098c9930f917ed6fb72215a3177733d6f9ede7ea55d1117644b0a5cca581f6737`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signMessage: {
      script: `03000601C707000000003CCC07C01A19457468657265756D205369676E6564204D6573736167653A0ACAAC970007CC0F106312A017C00401061507C002FF00B5A01700CAA1BE00BAE09F6C0D04DEF09700250E00250F00D207C0074D455353414745D207CC05065052455353425554546F4E`,
      signature: `304502200784b5392cceb1fea5f077d90125cd153d871e164c77aefa31ef4b94690f1fd00221009f77e5af2ee01a8c3b484cc0e3cdac77d984ca24664c336142bdf87d70ba7549`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signEIP1559Transaction: {
      script: `03040601C707000000003CCC071002A0070012AC17C0440401061507C002FF00B5AC170044C2ACB70045C2ACD7003CFFF8C2ACD7001EFFF6C2ACD70028FFF6C2ACD70032FFF6CC071094CAA02700C2A2D700FFF6CC071080CC0710C0BE0710CC0F106312AC17C0440401061507C002FF00B5AC170044CAACBE0045BAE09F6C0D04DEF09700250E00250F00CC0FC0023078BAA02F6C0E04DDF09700DAA2D7C0FFF612D207CC05065052455353425554546F4E`,
      signature: `3044022075004ded6e769a341ddce52c62bcad825c7209486ebe86cbf4cd9748e12f9fb202203e7d925119744262931ad3c56cb6cc35f3588aaccf8d13cb71ac8f229dbdaed5`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signEIP1559ERC20Transaction: {
      script: `03040601C707000000003CCC071002A0070012AC17C0460401061507C002FF00B5AC170046C2ACB70047C2ACD7003EFFF8C2A5D700FFF6C2ACD7002AFFF6C2ACD70034FFF6CC071094CAAC270056CC07C01380B844a9059cbb000000000000000000000000CAA02700CC07200000000000000000000000000000000000000000CAA2C7000CCC0710C0BE0710CC0F106312AC17C0460401061507C002FF00B5AC170046CAACBE0047BAE09F6C0D04DEF09700250E00250F00CC0F104012AC17C04E0401071507C002FF00B5AC17004ECAACBF004FDEF09700250F00CC0FC0023078BAA02F6C0E04DDF0970012AC17C04D0400141507C002FF00B5AC17004DDAA2C7B00CD207CC05065052455353425554546F4E`,
      signature: `3044022034f24075d205fe20041ce69de2df6f4cbb0ba25461a8074475fa72b33e9b6e7f0220553c5439eeda1ecfe4ef416174fb43d3a894557301fcb6b45be20389cac7e2fb`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signEIP1559SmartContractTransaction: {
      script: `03040601C707000000003CCC071002A0070012AC17C0440401061507C002FF00B5AC170044C2ACB70045C2ACD7003CFFF8C2ACD7001EFFF6C2ACD70028FFF6C2ACD70032FFF61AA027C0080000000000000000000000000000000000000000CC0710801507C008CC071094CAA02700C2A2D700FFF6C2AC97004BCC0710C0BE0710CC0F106312AC17C0440401061507C002FF00B5AC170044CAACBE0045BAE09F6C0D04DEF09700250E00250F00D207C005534D415254D207CC05065052455353425554546F4E`,
      signature: `30450221009b806140d5c17c6286e2101c4d841e97d6f1b3226d73a545beefb645b6c16c1702203450279abcb613c5ef6ac49be9217227fd555011a444b61871694951601ff8fc`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
    signEIP1559SmartContractSegmentTransaction: {
      script: `03050601C707000000003CCC071002A0070012AC17C0480401061507C002FF00B5AC170048C2ACB70049C2ACD7003CFFF8C2ACD7001EFFF6C2ACD70028FFF6C2ACD70032FFF61AA027C0080000000000000000000000000000000000000000CC0710801507C008CC071094CAA02700C2A2D700FFF6C4ACC7004404CC0710C0BE0710CC0F106312AC17C0480401061507C002FF00B5AC170048CAACBE0049BAE09F6C0D04DEF09700250E00250F00D207C005534D415254D207CC05065052455353425554546F4E`,
      signature: `304502201c7513a62629aa7442362004e5bd277a37d539b5dba0517eed10803b5e5ae1d7022100c0978de5e959bfa1fbe13924588c5bb5565b5ec3bc99b7d6648c0414e323c373`.padStart(
        144,
        '0'
      ),
      get scriptWithSignature(): string {
        return this.script + this.signature;
      },
    },
  };

  constructor(chainId: number) {
    super();
    this.id = chainId;
  }
  toHexChainInfo() {
    const chainIdHex = this.getChainId();
    const chainIdLength = this.getHexBufferLength(chainIdHex);
    return chainIdLength + chainIdHex.padEnd(12, '0');
  }
}
