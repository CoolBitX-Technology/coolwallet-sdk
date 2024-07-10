export const TX_ADDRESS_PRE = '00';

export enum COIN_TYPE {
  DOT = '80000162',
  KSM = '800001b2',
}

export enum DOT_ADDRESS_TYPE {
  DOT = 0,
  KSM = 2,
}

export const METHOD_CALL_INDEX = {
  DOT: {
    transfer: '0500',
    bond: '0700',
    bondExtra: '0701',
    unbond: '0702',
    nominate: '0705',
    withdraw: '0703',
    chill: '0706',
  },
  KSM: {
    transfer: '0400',
    bond: '0600',
    bondExtra: '0601',
    unbond: '0602',
    nominate: '0605',
    withdraw: '0603',
    chill: '0606',
  },
};

export enum payeeType {
  staked = '00',
  stash = '01',
  controller = '02',
  account = '03',
  none = '04',
}

export enum ValueMode {
  singleByteMode = 'singleByteMode',
  twoByteMode = 'twoByteMode',
  fourByteMode = 'fourByteMode',
  bigIntegerMode = 'bigIntegerMode',
}

export const SCRIPT_PARAMS = {
  DOT: {
    TRANSFER: {
      script: `03020E01C7070000000162CAA0C70002CC071000CAAC570002A2ACD70022FFF6CAACD7002CFFFBA2ACD70031FFFBA2ACD70036FFFBCC071000CAACC7003B04CAACC7003F04CAAC570043CAAC570063CC071000DC07C003444F54CC0FC00753533538505245CC0F1000CAAC5F00025AF09FC00FBAFCCE6C07230804DDE09700DAACD7C022FFF60AD207CC05065052455353425554546F4E`,
      signature: `0030450221009c565247e07f7cf0c23f2ff92e24a81800b849a7fce4c7198d8a7b5a49ae009b02204fcaffcf743adc77cf38f3688617c1b4507488c63020aadd69c01b5588910b66`,
    },
    BOND: {
      script: `03020E01C7070000000162CAA0C70002A2ACD70002FFF6CAAC17000CCAACD7000DFFFBA2ACD70012FFFBA2ACD70017FFFBCC071000CAACC7001C04CAA5C70004CAAC570024CAAC570044CC071000DC07C003444F54DC07C004426F6E64DAACD7C002FFF60AD207CC05065052455353425554546F4E`,
      signature: `003045022062eb23c4525f7aac3165a19ce9c6c2ddb1093a9335451682fcafad340a01aa40022100b9face959049ee49a95a2a98f830d88b1bba65fe4d2ad61f7045d4de7a45dda1`,
    },
    BOND_EXTRA: {
      script: `03020E01C7070000000162CAA0C70002A2ACD70002FFF6CAACD7000CFFFBA2ACD70011FFFBA2ACD70016FFFBCC071000CAACC7001B04CAACC7001F04CAAC570023CAAC570043CC071000DC07C003444F54DC07C007426F6E64457874DAACD7C002FFF60AD207CC05065052455353425554546F4E`,
      signature: `3046022100efca7ebba545a200be03115608b63971a4ef6947476cd0bd56e4644be1028ba0022100b2084f6b13340ffb793d5aa49f3dfd19179614555a58b0d094a7c5acdb17b12a`,
    },
    UNBOND: {
      script: `03020E01C7070000000162CAA0C70002A2ACD70002FFF6CAACD7000CFFFBA2ACD70011FFFBA2ACD70016FFFBCC071000CAACC7001B04CAACC7001F04CAAC570023CAAC570043CC071000DC07C003444F54DC07C006556E626F6E64DAACD7C002FFF60AD207CC05065052455353425554546F4E`,
      signature: `003045022047d26e1225ed4dd84af0b0618e88c75c6cb764b856b523525f3a9fc0d9513efa02210099a497e9586fd95f4c482545dfde737fd196255f83e01cc01ac4ae11cf10f813`,
    },
    NOMINATE: {
      singleHash: {
        script: `03020E01C7070000000162CAA0C70002A2AC170059CAAC97005ACAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC071000DC07C003444F54DC07C0064E6F6D696E74D207CC05065052455353425554546F4E`,
        signature: `0030450220607247af076ff32bc032bb8b46bcf34b161e32908191acb9d3d0a2382ccc90df022100d6058bf876a5660d76be18b826a0baa541953f1d6d3eaa27787a56c9b13b96d8`,
      },
      doubleHash: {
        script: `03020E01C7070000000162CAA0C70002A2AC170059CAAC97005ACAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC0710005A709FC00E250700CAF09700DC07C003444F54DC07C0064E6F6D696E74D207CC05065052455353425554546F4E`,
        signature: `003045022100defb254d89d891d10fe2cfd775304470bb6d36358e6c7c5671798af58aed2b5902200e62740d9c487274ad0789cd6144fe6cbd7e87a26b2ba4612909dc8ab52c5904`,
      },
    },
    WITHDRAW: {
      script: `03020E01C7070000000162CAA0C700021AACC7C002040C00000000CC07C004000000001507C009BAACC7CC0204040F02CAACD70006FFFBA2ACD7000BFFFBA2ACD70010FFFBCC071000CAACC7001504CAACC7001904CAAC57001DCAAC57003DCC071000DC07C003444F54DC07C006576974686472D207CC05065052455353425554546F4E`,
      signature: `3046022100b1ae70772aa407e76ae4fde88c7a51b85d0425672a5c25b4e9f5edfb525071e4022100fbe5ea6fea2cb89907e15a1fa30620758fcd74f329a5db1ab67368014ae03ab6`,
    },
    CHILL: {
      script: `03020E01C7070000000162CAA0C70002CAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC071000DC07C003444F54DC07C0054368696C6CD207CC05065052455353425554546F4E`,
      signature: `000030440220650736bcaf307a1c96e943731858589cf9a8771e72c2f9aaae24a32c6770feb2022066e7e2d153a0e5c9f905d74dab17b0a8326ecca38d20e67cfc960af78a6169d4`,
    },
  },
  KSM: {
    TRANSFER: {
      script: `03020E01C70700000001B2CAA0C70002CC071000CAAC570002A2ACD70022FFF6CAACD7002CFFFBA2ACD70031FFFBA2ACD70036FFFBCC071000CAACC7003B04CAACC7003F04CAAC570043CAAC570063CC071000DC07C0034B534DCC0FC00753533538505245CC0F1002CAAC5F00025AF09FC00FBAFCCE6C07230804DDE09700DAACD7C022FFF60CD207CC05065052455353425554546F4E`,
      signature: `0000304402206b6a25c922a614e66d0054210821b98e8420efa2fb871554c4f31e8d944c21f80220527431135a0e8fed7db8d3f76f49411d7da9ffba22e313c54bbe74b455c6de4f`,
    },
    BOND: {
      script: `03020E01C70700000001B2CAA0C70002A2ACD70002FFF6CAAC17000CCAACD7000DFFFBA2ACD70012FFFBA2ACD70017FFFBCC071000CAACC7001C04CAA5C70004CAAC570024CAAC570044CC071000DC07C0034B534DDC07C004426F6E64DAACD7C002FFF60CD207CC05065052455353425554546F4E`,
      signature: `3046022100b6a7b39e3a4a89e3df21d9e6f1fbbb1d5441ab8877432a5348b1640883b2ea9b0221008e5ef4ae778d7e877d208cbf2e890170bfb642789e90878888ab57c6eba639e2`,
    },
    BOND_EXTRA: {
      script: `03020E01C70700000001B2CAA0C70002A2ACD70002FFF6CAACD7000CFFFBA2ACD70011FFFBA2ACD70016FFFBCC071000CAACC7001B04CAACC7001F04CAAC570023CAAC570043CC071000DC07C0034B534DDC07C007426F6E64457874DAACD7C002FFF60CD207CC05065052455353425554546F4E`,
      signature: `003045022100c795d3f15772dc2d21ff5a5431eb09f02515371ac438402c61846d03ce3ab6a80220396cf63032f75b5e513d36b41b9ec4e8230a30d4629ae0ebdb8661d9fc4a5bc4`,
    },
    UNBOND: {
      script: `03020E01C70700000001B2CAA0C70002A2ACD70002FFF6CAACD7000CFFFBA2ACD70011FFFBA2ACD70016FFFBCC071000CAACC7001B04CAACC7001F04CAAC570023CAAC570043CC071000DC07C0034B534DDC07C006556E626F6E64DAACD7C002FFF60CD207CC05065052455353425554546F4E`,
      signature: `00304502207feb25ae89c5763872178b5c9057f7de904531a5126631e087295557942cedc60221008c23b64933c4c4239f4a118a5242216c5d68d925804ca0e5ad2eda51a1b08cfc`,
    },
    NOMINATE: {
      singleHash: {
        script: `03020E01C70700000001B2CAA0C70002A2AC170059CAAC97005ACAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC071000DC07C0034B534DDC07C0064E6F6D696E74D207CC05065052455353425554546F4E`,
        signature: `0000304402203598deafeaac8b0b71fd27f6bd455c6fd7fb8602c92e2d48f2993559b6ebce850220361c0347ce7483720ffd16b5ed50b4dbea198cbf2aa5b329fd095664042e0238`,
      },
      doubleHash: {
        script: `03020E01C70700000001B2CAA0C70002A2AC170059CAAC97005ACAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC0710005A709FC00E250700CAF09700DC07C0034B534DDC07C0064E6F6D696E74D207CC05065052455353425554546F4E`,
        signature: `3046022100d8a181a6fd5adfbcd6ff51e362cb45a82f6344c219b22a7f06ffa28ce0ffda80022100a4409b5cddba174375068e56197444901e781c6d1f4f09ac53c1fefcf7a4e8ad`,
      },
    },
    WITHDRAW: {
      script: `03020E01C70700000001B2CAA0C700021AACC7C002040C00000000CC07C004000000001507C009BAACC7CC0204040F02CAACD70006FFFBA2ACD7000BFFFBA2ACD70010FFFBCC071000CAACC7001504CAACC7001904CAAC57001DCAAC57003DCC071000DC07C0034B534DDC07C006576974686472D207CC05065052455353425554546F4E`,
      signature: `3046022100cafd70d98b3238276f566c9475301b46a6432216ca550f3777540ae12deccff9022100cb5136b0e7d96e807e047f23390e05f43dbf82b44e43026d698d4ee3a9e6bc5e`,
    },
    CHILL: {
      script: `03020E01C70700000001B2CAA0C70002CAACD70002FFFBA2ACD70007FFFBA2ACD7000CFFFBCC071000CAACC7001104CAACC7001504CAAC570019CAAC570039CC071000DC07C0034B534DDC07C0054368696C6CD207CC05065052455353425554546F4E`,
      signature: `0000304402200968ed85b7f76e64068e9a8e2537bf76a8982c2da7a149577f7d9bf78082f86e02202f39b27caf65174dfe844ebdebc35aa70892032b7cd8458065abe184f7066f4f`,
    },
  },
};
