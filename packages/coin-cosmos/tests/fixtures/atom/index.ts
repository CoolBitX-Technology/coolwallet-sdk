const MSG_SEND = [
  // {
  //   account_number: 838716,
  //   sequence: 16,
  //   toAddress: 'cosmos1e9979f7ya7j5zm9d036qj4lzw6u8a4k896wz6z',
  //   coin: {
  //     denom: 'uatom',
  //     amount: 4999000,
  //   },
  //   fee: {
  //     denom: 'uatom',
  //     amount: 1000,
  //     gas_limit: 200000,
  //   },
  //   memo: '',
  //   txHash: '7173C1865A5F7024BA96821C7B067F1147077BE8019AA263116AF6B98ADC7E8D',
  // },
  {
    account_number: 265141,
    sequence: 159,
    toAddress: 'cosmos1g3uqr8e3sxngqzwegnlls7h95hq7p7cycjszp3',
    coin: {
      denom: 'uatom',
      amount: 1,
    },
    fee: {
      denom: 'uatom',
      amount: 5000,
      gas_limit: 200000,
    },
    memo: 'Hi!',
  },
];

const MSG_DELEGATE = [
  {
    account_number: 460313,
    sequence: 53,
    validator_address: 'cosmosvaloper1vf44d85es37hwl9f4h9gv0e064m0lla60j9luj',
    coin: {
      denom: 'uatom',
      amount: 180000,
    },
    fee: {
      denom: 'uatom',
      amount: 6250,
      gas_limit: 250000,
    },
    memo: '',
    txHash: '97D3B5655FF63022EEC496F3D9E65B6632C83049690A813CA70D832CE0A1DB49',
  },
];

const MSG_UNDELEGATE = [
  {
    account_number: 15652,
    sequence: 106985,
    validator_address: 'cosmosvaloper1z8zjv3lntpwxua0rtpvgrcwl0nm0tltgpgs6l7',
    coin: {
      denom: 'uatom',
      amount: 242124582061,
    },
    fee: {
      denom: 'uatom',
      amount: 300,
      gas_limit: 250000,
    },
    memo: '',
    txHash: '2D7B0AEA284283F141291ADAF5CA51B7AE9F69F019F8544CCBD3BF7B31CFB27B',
  },
];

const MSG_WITHDRAW = [
  {
    account_number: 372359,
    validator_address: 'cosmosvaloper1tflk30mq5vgqjdly92kkhhq3raev2hnz6eete3',
    sequence: 32,
    fee: {
      denom: 'uatom',
      amount: 3500,
      gas_limit: 140000,
    },
    memo: '',
    txHash: '95CD14B1D7EE65D451944D1A076514ABB6ACD02CCAB0F926B0B9CA811627DC01',
  },
];

export { MSG_SEND, MSG_DELEGATE, MSG_UNDELEGATE, MSG_WITHDRAW };
